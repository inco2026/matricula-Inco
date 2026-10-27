const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
async function cargar() {
  const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/crear-usuario/index.ts'), 'utf8')
    .replace(/^import[^\n]+\n/, '').split('\nconst admin = createClient(')[0];
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
function entorno(rol = 'administrador', falloPerfil = false) {
  const creados = [], borrados = [];
  let guardado;
  const admin = {
    auth: {
      async getUser(token) { return token === 'valido' ? { data: { user: { id: 'autor' } } } : { error: true }; },
      admin: {
        async createUser(datos) { creados.push(datos); return { data: { user: { id: 'nuevo' } } }; },
        async deleteUser(id) { borrados.push(id); return {}; },
      },
    },
    from() { return {
      select() { return this; }, eq() { return this; }, ilike() { return this; }, async limit() { return {data:[]}; },
      upsert(datos) { guardado = datos; return this; },
      async single() { return guardado ? (falloPerfil ? { error: true } : { data: guardado }) : { data: { rol } }; },
    }; },
  };
  return { admin, creados, borrados };
}
function peticion(rol = 'docente', token = 'valido') {
  return new Request('http://localhost/crear-usuario', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Ana', correo: 'ANA@example.com', contrasena: 'Prueba12345', rol }) });
}
test('Servidor: crea cada rol y guarda perfil con el mismo UID', async () => {
  const { crearManejador } = await cargar();
  for (const rol of ['administrador', 'coordinador', 'docente']) {
    const e = entorno();
    const res = await crearManejador(e.admin)(peticion(rol));
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.usuario.rol, rol);
    assert.equal(body.usuario.id, 'nuevo');
    assert.equal(body.usuario.correo, 'ana@example.com');
    assert.equal(e.creados[0].email_confirm, true);
    assert.equal(body.usuario.contrasena, undefined);
  }
});
test('Servidor: rechaza docentes, coordinadores, sesiones inválidas y roles falsos', async () => {
  const { crearManejador } = await cargar();
  for (const rol of ['docente', 'coordinador']) {
    const e = entorno(rol);
    assert.equal((await crearManejador(e.admin)(peticion('administrador'))).status, 403);
    assert.equal(e.creados.length, 0);
  }
  const e = entorno();
  assert.equal((await crearManejador(e.admin)(peticion('docente', 'falso'))).status, 401);
  assert.equal((await crearManejador(e.admin)(peticion('superadmin'))).status, 400);
  assert.equal(e.creados.length, 0);
});
test('Servidor: revierte la cuenta si no se pudo guardar el perfil', async () => {
  const { crearManejador } = await cargar();
  const e = entorno('administrador', true);
  assert.equal((await crearManejador(e.admin)(peticion())).status, 500);
  assert.deepEqual(e.borrados, ['nuevo']);
});

test('Servidor: distingue fallo de consulta de un rol sin permiso', async () => {
  const { crearManejador } = await cargar();
  const e = entorno();
  e.admin.from = () => ({
    select() { return this; }, eq() { return this; },
    async single() { return { error: { code: '42501', message: 'permission denied for table perfiles' } }; },
  });
  const res = await crearManejador(e.admin)(peticion());
  assert.equal(res.status, 500);
  const cuerpo = await res.json();
  assert.equal(cuerpo.codigo, 'CONSULTA_PERFIL');
  assert.match(cuerpo.error, /42501/);
  assert.equal(e.creados.length, 0);
});

test('Servidor: un administrador inhabilitado no puede crear cuentas',async()=>{
 const {crearManejador}=await cargar();const e=entorno();
 e.admin.from=()=>({select(){return this},eq(){return this},async single(){return {data:{rol:'administrador',activo:false}}}});
 assert.equal((await crearManejador(e.admin)(peticion())).status,403);
 assert.equal(e.creados.length,0);
});
