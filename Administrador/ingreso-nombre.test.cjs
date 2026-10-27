const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
async function cargar() {
 const source=fs.readFileSync(path.join(__dirname,'../supabase/functions/crear-usuario/index.ts'),'utf8').replace(/^import[^\n]+\n/,'').split('\nconst admin = createClient(')[0];
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const perfil={id:'id-real',nombre:'Ana María Pérez',correo:'ana@example.com',activo:true};
function entorno(perfiles=[perfil]) {
 const consulta=[], accesos=[];
 const admin={from(){return {select(){return this},ilike(campo,valor){consulta.push({campo,valor});return this},async limit(){return {data:perfiles}}}}};
 const autenticar=async(correo,contrasena)=>{
  accesos.push({correo,contrasena});
  return contrasena==='Correcta123' ? {data:{user:{id:'id-real'},session:{access_token:'token',refresh_token:'refresh'}}} : {error:true};
 };
 return {admin,autenticar,consulta,accesos};
}
test('Nombre: valida contraseña y devuelve sesión sin exponer el correo',async()=>{
 const {crearManejador}=await cargar();const e=entorno();
 const req=new Request('https://localhost',{method:'POST',body:JSON.stringify({accion:'ingresar',nombre:'  Ana   María Pérez ',contrasena:'Correcta123'})});
 const res=await crearManejador(e.admin,e.autenticar)(req);
 assert.equal(res.status,200);
 assert.equal(e.consulta[0].valor,'Ana María Pérez');
 assert.equal(e.accesos[0].correo,'ana@example.com');
 const texto=await res.text();assert.ok(!texto.includes('ana@example.com'));
 assert.equal(JSON.parse(texto).session.access_token,'token');
});
test('Nombre: rechaza desconocidos, duplicados, inhabilitados y contraseñas incorrectas',async()=>{
 const {ingresarPorNombre}=await cargar();
 for(const perfiles of [[],[perfil,perfil],[{...perfil,activo:false}]]){
  const e=entorno(perfiles);const res=await ingresarPorNombre(e.admin,e.autenticar,{nombre:perfil.nombre,contrasena:'Correcta123'});
  assert.equal(res.status,401);assert.equal(e.accesos.length,0);
 }
 const e=entorno();assert.equal((await ingresarPorNombre(e.admin,e.autenticar,{nombre:perfil.nombre,contrasena:'Mala'})).status,401);
});
test('Nombre: escapa comodines y no acepta una sesión de otro UID',async()=>{
 const {ingresarPorNombre}=await cargar();const e=entorno();
 await ingresarPorNombre(e.admin,e.autenticar,{nombre:'Ana_%',contrasena:'Correcta123'});
 assert.equal(e.consulta[0].valor,'Ana\\_\\%');
 const res=await ingresarPorNombre(e.admin,async()=>({data:{user:{id:'otro'},session:{access_token:'token'}}}),{nombre:perfil.nombre,contrasena:'Correcta123'});
 assert.equal(res.status,401);
});
