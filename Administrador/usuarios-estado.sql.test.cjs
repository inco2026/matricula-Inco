const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {PGlite} = createRequire('C:/Users/consu/AppData/Local/Temp/inco-pruebas-usuarios/package.json')('@electric-sql/pglite');

test('SQL: permisos, bloqueo de sesiones, reactivación y protección del administrador', async () => {
 const db = new PGlite();
 const admin = '00000000-0000-4000-8000-000000000001';
 const docente = '00000000-0000-4000-8000-000000000002';
 try {
  await db.exec(`
   CREATE ROLE anon; CREATE ROLE authenticated;
   CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated;
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
   CREATE TABLE public.perfiles(id uuid PRIMARY KEY, rol text, nombre text, correo text);
   CREATE TABLE public.alumnos(id integer PRIMARY KEY);
   INSERT INTO public.perfiles VALUES ('${admin}','administrador','Admin','admin@example.com'),('${docente}','docente','Docente','docente@example.com');
   INSERT INTO public.alumnos VALUES(1);
   ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
   CREATE POLICY permitir_prueba ON public.perfiles FOR ALL TO authenticated USING(true) WITH CHECK(true);
   CREATE POLICY permitir_prueba ON public.alumnos FOR ALL TO authenticated USING(true) WITH CHECK(true);
   GRANT SELECT,UPDATE ON public.perfiles TO authenticated;
   GRANT SELECT ON public.alumnos TO authenticated;
  `);
  const migracion = fs.readFileSync(path.join(__dirname,'../supabase/activar-inhabilitacion.sql'),'utf8');
  await db.exec(migracion);
  await db.exec(migracion); // La activación se puede repetir sin borrar datos.
  async function actor(id) { await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${id}',false); SET ROLE authenticated;`); }
  await actor(admin);
  await assert.rejects(db.query('SELECT public.cambiar_estado_usuario($1,false)',[admin]), /propia cuenta/);
  await db.query('SELECT public.cambiar_estado_usuario($1,false)',[docente]);
  await actor(docente);
  assert.equal((await db.query('SELECT * FROM public.alumnos')).rows.length,0);
  await assert.rejects(db.query('SELECT public.cambiar_estado_usuario($1,true)',[docente]), /administrador activo/);
  await db.query('UPDATE public.perfiles SET activo=true WHERE id=$1',[docente]);
  await actor(admin);
  assert.equal((await db.query('SELECT activo FROM public.perfiles WHERE id=$1',[docente])).rows[0].activo,false);
  await db.query('SELECT public.cambiar_estado_usuario($1,true)',[docente]);
  await actor(docente);
  assert.equal((await db.query('SELECT * FROM public.alumnos')).rows.length,1);
  await assert.rejects(db.query('UPDATE public.perfiles SET activo=false WHERE id=$1',[admin]),/administrador activo/);
  await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false);");
  await assert.rejects(db.query('UPDATE public.perfiles SET activo=false WHERE id=$1',[admin]),/al menos un administrador/);
  await db.exec('SET ROLE anon;');
  await assert.rejects(db.query('SELECT public.cambiar_estado_usuario($1,false)',[docente]),/permission denied/);
 } finally { await db.close(); }
});
