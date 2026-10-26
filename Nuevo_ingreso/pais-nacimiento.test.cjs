const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const http=require('node:http');
const {chromium}=require('C:/Users/28913/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
test('país, búsqueda local, nacimiento exterior y recuperación del borrador',async()=>{
 const root=__dirname;
 const server=http.createServer((req,res)=>{
  const name=req.url.split('?')[0];
  res.setHeader('Content-Type',/\.(m?js)$/.test(name)?'text/javascript':name.endsWith('.css')?'text/css':'text/html');
  if(name==='/supabase-config.js')return res.end('export const supabase={rpc:async()=>({data:false})};');
  const file=path.join(root,name);
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.statusCode=404;return res.end();}
  let data=fs.readFileSync(file);
  if(name==='/nuevo_ingreso.js')data+='\nwindow.pruebas={validarCampo,nacimientoParaGuardar};';
  res.end(data);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{for(const name of ['nuevo_ingreso.html','FORMULARIO.html']){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${name}`);
  await page.waitForFunction(()=>document.querySelector('form').dataset.borradorListo==='true');
  assert.equal(await page.locator('#paisNacimiento').inputValue(),'SV');
  await page.locator('#departamentoNacimientoBusqueda').fill('San Salvador');
  await page.locator('#departamentoNacimientoBusquedaOpciones [role=option]').click();
  await page.locator('#lugarNacimientoBusqueda').fill('San Salvador');
  await page.locator('#lugarNacimientoBusquedaOpciones [role=option]').filter({hasText:/^San Salvador -/}).click();
  assert.equal(await page.evaluate(()=>pruebas.nacimientoParaGuardar()),'San Salvador - San Salvador Centro');
  await page.locator('#paisNacimiento').selectOption('GT');
  assert.equal(await page.locator('#nacimientoSV').isVisible(),false);
  assert.equal(await page.locator('#lugarNacimiento').isDisabled(),true);
  assert.equal(await page.evaluate(()=>pruebas.validarCampo(document.getElementById('nacimientoExtranjero'))),false);
  await page.locator('#nacimientoExtranjero').fill('Ciudad de Guatemala');
  assert.equal(await page.evaluate(()=>pruebas.nacimientoParaGuardar()),'Ciudad de Guatemala - Guatemala');
  await page.waitForTimeout(1000);await page.reload();
  await page.waitForFunction(()=>document.querySelector('form').dataset.borradorListo==='true');
  assert.equal(await page.locator('#paisNacimiento').inputValue(),'GT');
  assert.equal(await page.locator('#nacimientoExtranjero').inputValue(),'Ciudad de Guatemala');
  await page.locator('#paisNacimiento').selectOption('SV');
  assert.equal(await page.locator('#departamentoNacimientoBusqueda').isVisible(),true);
  assert.equal(await page.locator('#nacimientoExtranjero').isDisabled(),true);
  assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
});
