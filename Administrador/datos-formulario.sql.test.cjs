const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {createRequire}=require('node:module');const {PGlite}=createRequire('C:/Users/consu/AppData/Local/Temp/inco-pruebas-usuarios/package.json')('@electric-sql/pglite');
test('Guardado: conserva formulario completo y enlaza país y modalidad en una transacción',async()=>{
 const db=new PGlite();try{
 await db.exec("CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE public.alumnos(id uuid PRIMARY KEY);CREATE TABLE public.matriculas(id uuid PRIMARY KEY,alumno_id uuid,numero_ficha text UNIQUE);");
 await db.exec("CREATE FUNCTION public.crear_matricula(p jsonb) RETURNS uuid LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.alumnos VALUES('00000000-0000-4000-8000-000000000001'); INSERT INTO public.matriculas VALUES('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001',p->>'numeroFicha'); RETURN '00000000-0000-4000-8000-000000000002'::uuid; END $$;");
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/activar-datos-formulario.sql'),'utf8'));
 const payload={numeroFicha:'20270001',tipoModalidad:'Modalidad Regular',paisNacimiento:'Guatemala',fotoEstudiante:'foto',madreNombre:'Ana',condicionesSalud:[{enfermedad:'Asma',medicamento:'Inhalador'}],hermanos:[{nombre:'Luis',nie:'0012345',grado:'Primer Año'}]};
 await db.query('SELECT public.crear_matricula_con_modalidad($1::jsonb)',[JSON.stringify(payload)]);
 const fila=(await db.query('SELECT m.*,a.pais_nacimiento FROM public.matriculas m JOIN public.alumnos a ON a.id=m.alumno_id')).rows[0];
 assert.equal(fila.tipo_modalidad,'Modalidad Regular');assert.equal(fila.pais_nacimiento,'Guatemala');assert.deepEqual(fila.datos_formulario.hermanos,payload.hermanos);assert.deepEqual(fila.datos_formulario.condicionesSalud,payload.condicionesSalud);assert.equal(fila.datos_formulario.fotoEstudiante,undefined);
 }finally{await db.close()}
});
