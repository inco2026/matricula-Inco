const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {PGlite} = createRequire('C:/Users/consu/AppData/Local/Temp/inco-pruebas-usuarios/package.json')('@electric-sql/pglite');

test('Revisión SQL: solo administrador activo, estado persistente y auditoría', async () => {
 const db = new PGlite();
 const admin = '00000000-0000-4000-8000-000000000001';
 const docente = '00000000-0000-4000-8000-000000000002';
 const coordinador = '00000000-0000-4000-8000-000000000003';
 const matricula = '00000000-0000-4000-8000-000000000004';
 try {
  await db.exec(`
   CREATE ROLE anon; CREATE ROLE authenticated;
   CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated;
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
   CREATE TABLE auth.users(id uuid PRIMARY KEY);
   INSERT INTO auth.users VALUES('${admin}'),('${docente}'),('${coordinador}');
   CREATE TABLE public.perfiles(id uuid PRIMARY KEY, rol text, nombre text, activo boolean DEFAULT true);
   INSERT INTO public.perfiles(id,rol,nombre) VALUES('${admin}','administrador','Ana'),('${docente}','docente','Luis'),('${coordinador}','coordinador','José');
   CREATE TABLE public.matriculas(id uuid PRIMARY KEY, estado text DEFAULT 'Activo');
   INSERT INTO public.matriculas(id) VALUES('${matricula}');
   GRANT SELECT,UPDATE,INSERT ON public.matriculas TO authenticated;
  `);
  const sql = fs.readFileSync(path.join(__dirname,'../supabase/activar-revision-matricula.sql'),'utf8');
  await db.exec(sql); await db.exec(sql);
  async function actor(id) { await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${id}',false); SET ROLE authenticated;`); }
  for(const id of [docente,coordinador]) {
    await actor(id);
    await assert.rejects(db.query('SELECT public.revisar_matricula($1,true)',[matricula]),/administrador activo/);
    await assert.rejects(db.query('UPDATE public.matriculas SET revision_completa=true WHERE id=$1',[matricula]),/administrador activo/);
  }
  await actor(admin);
  const resultado = (await db.query('SELECT public.revisar_matricula($1,true) AS revision',[matricula])).rows[0].revision;
  assert.equal(resultado.situacion_matricula,'Matriculado');
  assert.equal(resultado.revisado_por,admin);
  assert.equal(resultado.revisado_por_nombre,'Ana');
  assert.ok(resultado.revisado_en);
  await db.query('SELECT public.revisar_matricula($1,false)',[matricula]);
  assert.equal((await db.query('SELECT situacion_matricula FROM public.matriculas WHERE id=$1',[matricula])).rows[0].situacion_matricula,'Inscrito');
  await assert.rejects(db.query('SELECT public.revisar_matricula($1,NULL)',[matricula]),/completo o incompleto/);
  await db.exec(`RESET ROLE; UPDATE public.perfiles SET activo=false WHERE id='${admin}';`);
  await actor(admin);
  await assert.rejects(db.query('SELECT public.revisar_matricula($1,true)',[matricula]),/administrador activo/);
  await db.exec('RESET ROLE; SET ROLE anon;');
  await assert.rejects(db.query('SELECT public.revisar_matricula($1,true)',[matricula]),/permission denied/);
 } finally { await db.close(); }
});
