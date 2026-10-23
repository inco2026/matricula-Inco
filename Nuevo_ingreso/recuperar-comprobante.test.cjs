const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');
const runtime = process.env.CODEX_NODE_MODULES || 'C:/Users/28913/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = createRequire(path.join(runtime, 'playwright', 'package.json'))('playwright');

test('recuperación: verifica datos, no crea matrículas, muestra ficha original y permite imprimir', async () => {
  const servidor = http.createServer((req,res) => {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : req.url.endsWith('.css') ? 'text/css' : 'text/html');
    if (['/supabase-config.js', '/Nuevo_ingreso/supabase-config.js'].includes(req.url)) return res.end(`export const supabase = { rpc(nombre, args) {
      if(nombre !== 'recuperar_comprobante') throw Error('No debe escribir matrículas');
      window.consultas = (window.consultas || 0) + 1; window.argumentos = args;
      return { abortSignal: async () => {
        await new Promise(r => setTimeout(r, 40));
        if(window.modo === 'error') return {error:{code:'PGRST202'}};
        if(window.modo === 'limite') return {data:{limitado:true}};
        if(args.p_dui !== '01234567-8') return {data:null};
        return {data:{numeroFicha:'FIC-2027-646',nie:args.p_nie,estudiante:'<img src=x onerror=alert(1)>',grado:'Tercer Año',fechaMatricula:'22/10/2026'}};
      }};
    }};`);
    if (req.url === '/index.html') return res.end(fs.readFileSync(path.join(__dirname,'..','index.html')));
    const archivo = path.resolve(__dirname, '.' + req.url.replace('/Nuevo_ingreso',''));
    if (!archivo.startsWith(__dirname + path.sep) || !fs.existsSync(archivo)) { res.writeHead(404); return res.end(); }
    res.end(fs.readFileSync(archivo));
  });
  await new Promise(r=>servidor.listen(0,'127.0.0.1',r));
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true});
    const page = await browser.newPage();
    const errores = []; page.on('pageerror',e=>errores.push(e.message));
    await page.route('https://**/*', route=>route.abort());
    await page.goto(`http://127.0.0.1:${servidor.address().port}/Nuevo_ingreso/recuperar-comprobante.html`);
    const llenar = async (dui='01234567-8') => {
      await page.locator('#nie').fill('289132934');
      await page.locator('#nacimiento').fill('2009-11-14');
      await page.locator('#dui').fill(dui);
    };
    await llenar('02345678-9'); await page.locator('#buscar').click();
    await page.waitForFunction(()=>document.getElementById('estado').textContent.startsWith('No se pudo recuperar'));
    assert.equal(await page.locator('#resultado').isVisible(),false);
    await llenar();
    await page.evaluate(()=>{ const f=document.getElementById('consulta'); f.requestSubmit(); f.requestSubmit(); });
    await page.locator('#resultado').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>window.consultas),2);
    assert.ok((await page.locator('#datos').innerText()).includes('FIC-2027-646'));
    assert.equal(await page.locator('#datos img').count(),0);
    assert.equal(await page.locator('#dui').inputValue(),'');
    assert.deepEqual(await page.evaluate(()=>window.argumentos),{p_nie:'289132934',p_nacimiento:'2009-11-14',p_dui:'01234567-8'});
    await page.evaluate(()=>window.print=()=>window.impreso=true);
    await page.locator('#imprimir').click(); assert.equal(await page.evaluate(()=>window.impreso),true);
    const descargaPendiente = page.waitForEvent('download');
    await page.locator('#pdf').click();
    const descarga = await descargaPendiente;
    assert.equal(descarga.suggestedFilename(), 'Comprobante-FIC-2027-646.pdf');
    assert.equal(await descarga.failure(), null);
    await page.locator('#tema').click(); assert.equal(await page.locator('body').getAttribute('class'),'oscuro');
    await page.locator('#cerrar').click(); assert.equal(await page.locator('#resultado').isVisible(),false);
    for (const modo of ['limite','error']) {
      await page.evaluate(m=>window.modo=m,modo); await llenar(); await page.locator('#buscar').click();
      await page.waitForFunction(()=>!document.getElementById('buscar').disabled);
      assert.equal(await page.locator('#resultado').isVisible(),false);
      assert.match(await page.locator('#estado').innerText(),modo==='limite'?/15 minutos/:/no está habilitada/);
    }
    await page.reload(); assert.equal(await page.locator('#resultado').isVisible(),false);
    for (const id of ['nie','nacimiento','dui']) assert.equal(await page.locator('#'+id).inputValue(), '', 'la consulta se abre vacía');
    await llenar();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted:true })));
    for (const id of ['nie','nacimiento','dui']) assert.equal(await page.locator('#'+id).inputValue(), '', 'no restaura datos al volver');
    assert.deepEqual(errores,[]);
  } finally { await browser?.close(); await new Promise(r=>servidor.close(r)); }
});
