const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','supabase-data.js'),'utf8').replace(/^import[^\n]+\n/,'').replace(/export\s*\{[\s\S]*?\};\s*$/,'');
function entorno(supabase){
 const tiempos=[];const callbacks=[];
 const ctx={supabase,setTimeout(fn,ms){tiempos.push(ms);callbacks.push(fn);return ms;},clearTimeout(){}};
 vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,tiempos,callbacks};
}
test('Reportes: consulta ligera, paginación y espera de 10 segundos',async()=>{
 const selecciones=[],rangos=[];
 const fila={id:'1',alumno_id:'a',numero_ficha:'123',alumnos:{nie:'1234567',primer_nombre:'Ana'},documentos_matricula:{items:{actaCoordinador:{solvente:true}}}};
 const chain={select(s){selecciones.push(s);return this},order(){return this},async range(a,b){rangos.push([a,b]);return {data:a===0?Array(500).fill(fila):[fila],error:null}}};
 const {ctx,tiempos}=entorno({from(){return chain}});
 const resultados=await ctx.listarMatriculas();
 assert.equal(resultados.length,501);assert.equal(resultados[0].nie,'1234567');assert.equal(resultados[0].documentosChecklist.actaCoordinador.solvente,true);
 assert.deepEqual(tiempos,[10000]);assert.deepEqual(rangos,[[0,499],[500,999]]);
 assert.ok(selecciones.every(s=>!s.includes('foto_base64')&&!s.includes('padres')));
});
test('Búsqueda: muestra mensaje de 10 segundos y conserva errores del servidor',async()=>{
 const e=entorno({from(){return {select(){return this},order(){return this},range(){return new Promise(()=>{})}}}});
 const pendiente=e.ctx.listarMatriculas();e.callbacks[0]();
 await assert.rejects(pendiente,/10 segundos/);
 const fallo=entorno({from(){return {select(){return this},order(){return this},async range(){return {error:new Error('Sin permisos'),data:null}}}}});
 await assert.rejects(fallo.ctx.listarMatriculas(),/Sin permisos/);
});


test('Excel: obtiene fichas completas y conserva el orden filtrado', async()=>{
 const lotes=[];
 const {ctx}=entorno({from(){return {select(s){assert.ok(s.includes('padres (*)'));return this},async in(c,ids){lotes.push(ids);return {data:[...ids].reverse().map(id=>({id,alumnos:{nie:'0012345',padres:{madre_nombre:'Ana'}}})),error:null}}}}});
 const registros=await ctx.obtenerMatriculasParaExcel(Array.from({length:51},(_,i)=>String(i)));
 assert.equal(lotes.length,2);assert.equal(registros[0].id,'0');assert.equal(registros[50].id,'50');
 assert.equal(registros[0].datosCompletos.alumnos.padres.madre_nombre,'Ana');
});

test('Excel: solo campos del formulario, columnas claras y resumen por grado',async()=>{
 const {prepararReporteCompleto,CAMPOS_FORMULARIO_EXCEL}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(__dirname,'..','reporte-excel.js'),'utf8')).toString('base64'));
 const registros=[
 {id:'NO_EXPORTAR',alumnoId:'TAMPOCO',nie:'0012345',telefonoEstudiante:'00112233',edad:0,madreNombre:'Ana',padreNombre:'Luis',tallaCamisa:'M',grado:'Primer Año',especialidad:'Administrativo Contable',estado:'Inscrito',datosCompletos:{alumnos:{foto_base64:'NO_EXPORTAR_FOTO'},documentos_matricula:{id:'NO_EXPORTAR_DOCUMENTOS'}}},
 {grado:'Primer Año',especialidad:'Administrativo Contable',estado:'Matriculado'},
 {grado:'Tercer Año',especialidad:'Desarrollo de Software',estado:'Matriculado'}];
 const {encabezados,filas,hojasAdicionales}=prepararReporteCompleto(registros);
 for(const valor of ['00112233',0,'Ana','Luis','M']) assert.ok(filas[0].includes(valor),String(valor));
 assert.ok(!JSON.stringify(filas).includes('NO_EXPORTAR'));
 assert.equal(encabezados.length,filas[0].length);
 assert.ok(encabezados.includes('Teléfono del estudiante'));
 assert.ok(encabezados.includes('Teléfono del responsable'));
 assert.ok(encabezados.includes('Celular de la madre'));
 assert.deepEqual(hojasAdicionales[0].filas,[['Primer Año','Administrativo Contable',2,1,1],['Tercer Año','Desarrollo de Software',1,0,1],['TOTAL','',3,1,2]]);
 const claves=new Set(CAMPOS_FORMULARIO_EXCEL.map(([k])=>k));
 const omitidos=new Set(['fotoEstudiante','estadoRevisionEdad','fechaCorteEdad','conQuienViveOtro']);
 for(const archivo of ['FORMULARIO.html','nuevo_ingreso.html']) {
   const html=fs.readFileSync(path.join(__dirname,'..','Nuevo_ingreso',archivo),'utf8');
   for(const [,nombre] of html.matchAll(/name="([^"]+)"/g)) {
     if(nombre==='viewport'||omitidos.has(nombre))continue;
     assert.ok(claves.has(nombre),archivo+': falta '+nombre);
   }
 }
});


test('Usuarios: verifica el UID real y distingue un rechazo del servidor',async()=>{
 let invocados=0,uid='';
 const cliente = {
   auth: {
     async getSession() { return {data:{session:{access_token:'token'}}}; },
     async getUser() { return {data:{user:{id:'administrador-real',email:'admin@example.com'}}}; }
   },
   from() { return {
     select(){return this;}, eq(c,id){uid=id;return this;},
     async single(){return {data:{rol:'administrador'}};}
   }; },
   functions: { async invoke(){
     invocados++;
     return {error:{context:new Response(JSON.stringify({error:'Solo un administrador puede crear usuarios.'}))}};
   } }
 };
 const {ctx}=entorno(cliente);
 await assert.rejects(ctx.crearUsuario({nombre:'Ana',correo:'ana@example.com',contrasena:'Prueba123',rol:'docente'}),/sí está verificada como administrador/);
 assert.equal(uid,'administrador-real');assert.equal(invocados,1);
 cliente.from=()=>({select(){return this},eq(){return this},async single(){return {data:{rol:'docente'}}}});
 await assert.rejects(ctx.crearUsuario({rol:'administrador'}),/no tiene rol de administrador/);
 assert.equal(invocados,1);
});

test('Consulta: recupera modalidad, país, hermanos y todas las condiciones de salud',()=>{
 const {ctx}=entorno({});
 const plano=ctx.aDocumentoPlano({id:'1',tipo_modalidad:'Modalidad Regular',alumnos:{pais_nacimiento:'Guatemala',padres:{madre_nombre:'Ana',padre_celular:'71234567'}},estudios:{nombres_hermanos:'Luis — Primero — NIE: 0012345'},datos_formulario:{condicionesSalud:[{enfermedad:'Asma',medicamento:'Inhalador',otros:'Control'},{enfermedad:'Alergia',medicamento:'Antihistamínico',otros:''}]}});
 assert.equal(plano.tipoModalidad,'Modalidad Regular');assert.equal(plano.paisNacimiento,'Guatemala');assert.equal(plano.madreNombre,'Ana');assert.equal(plano.cualEnfermedad,'Asma; Alergia');assert.equal(plano.medicamento,'Inhalador; Antihistamínico');assert.match(plano.nombresHermanos,/0012345/);
});
