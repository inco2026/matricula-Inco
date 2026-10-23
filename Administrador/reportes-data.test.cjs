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
