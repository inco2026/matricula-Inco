// PostgreSQL local de prueba; no conecta con Supabase ni usa datos reales.
// PGLITE_PATH debe apuntar al dist/index.js de @electric-sql/pglite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

test('migración y guardado atómico de disponibilidad en PostgreSQL', { skip: !process.env.PGLITE_PATH }, async () => {
  const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH));
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE public.matriculas(id uuid PRIMARY KEY, nie text UNIQUE);
      CREATE TABLE public.documentos_matricula(matricula_id uuid PRIMARY KEY REFERENCES matriculas(id), tipo_indicaciones text, items jsonb, observaciones text);
      CREATE FUNCTION public.crear_matricula(p jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
      DECLARE nuevo uuid := gen_random_uuid(); BEGIN
        INSERT INTO public.matriculas VALUES(nuevo, p->>'nie');
        IF p->>'sinFila' IS NULL THEN INSERT INTO public.documentos_matricula VALUES(nuevo,'primer_nuevo','{"principal":[{"marcado":true}]}',''); END IF;
        RETURN nuevo;
      END; $$;
      REVOKE ALL ON FUNCTION public.crear_matricula(jsonb) FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION public.crear_matricula(jsonb) TO anon, authenticated;`);
    const sql = await readFile(new URL('./documentos-disponibles.sql', import.meta.url), 'utf8');
    await db.exec(sql);
    await db.exec(sql);
    const datos = {nie:'prueba-1',grado:'Tercer Año',tipoIngreso:'Antiguo ingreso',disponibilidadDocumentos:{grado:'Tercer Año',tipoIngreso:'Antiguo ingreso',documentos:[1,2,3,4].map(numero => ({numero,texto:`Documento ${numero}`,disponible:[1,4].includes(numero)}))}};
    await db.exec('SET ROLE anon');
    await db.query('SELECT public.crear_matricula_con_documentos($1::jsonb)', [JSON.stringify(datos)]);
    await db.exec('RESET ROLE');
    let filas = (await db.query('SELECT items FROM public.documentos_matricula')).rows;
    assert.deepEqual(filas[0].items.disponibilidadEstudiante.documentos.map(d => d.disponible), [true,false,false,true]);
    assert.deepEqual(filas[0].items.principal, [{marcado:true}], 'conserva la revisión docente');
    datos.nie = 'prueba-2'; datos.sinFila = 'si';
    await db.query('SELECT public.crear_matricula_con_documentos($1::jsonb)', [JSON.stringify(datos)]);
    assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.documentos_matricula')).rows[0].n, 2);
    datos.nie = 'prueba-invalida'; datos.disponibilidadDocumentos.documentos[0].disponible = 'si';
    await assert.rejects(db.query('SELECT public.crear_matricula_con_documentos($1::jsonb)', [JSON.stringify(datos)]));
    assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.matriculas')).rows[0].n, 2, 'los datos inválidos no crean matrícula');
    datos.disponibilidadDocumentos.documentos[0].disponible = true;
    await db.exec("ALTER TABLE public.documentos_matricula ADD CONSTRAINT fallo_simulado CHECK (items->'disponibilidadEstudiante'->>'grado' <> 'Primer Año');");
    datos.grado = datos.disponibilidadDocumentos.grado = 'Primer Año';
    await assert.rejects(db.query('SELECT public.crear_matricula_con_documentos($1::jsonb)', [JSON.stringify(datos)]));
    assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.matriculas')).rows[0].n, 2, 'un fallo al guardar documentos revierte también la matrícula');
  } finally { await db.close(); }
});
