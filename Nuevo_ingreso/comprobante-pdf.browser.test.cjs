const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {createRequire} = require('node:module');
const {pathToFileURL} = require('node:url');
const runtime = process.env.CODEX_NODE_MODULES || 'C:/Users/28913/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium} = createRequire(path.join(runtime,'playwright','package.json'))('playwright');
const salida = path.join(__dirname,'tmp','pdfs');

test('PDF real completo en A4: móvil, laptop, scroll, tema oscuro y recuperación', async () => {
  const pdfjs = await import(pathToFileURL(path.join(runtime,'pdfjs-dist','legacy','build','pdf.mjs')));
  fs.mkdirSync(salida,{recursive:true});
  const raiz = path.resolve(__dirname,'..');
  const servidor = http.createServer((req,res) => {
    const nombre = decodeURIComponent(req.url.split('?')[0]);
    res.setHeader('Content-Type', /\.(m?js)$/.test(nombre) ? 'text/javascript' : nombre.endsWith('.css') ? 'text/css' : nombre.endsWith('.png') ? 'image/png' : 'text/html');
    if(['/supabase-config.js','/Nuevo_ingreso/supabase-config.js'].includes(nombre)) return res.end(`export const supabase={rpc(nombre){return {abortSignal:async()=>({data:{numeroFicha:'FIC-2027-388',nie:'342424234324',estudiante:'Manuel Antonio Cordero Ávalos',grado:'Tercer Año',especialidad:'Servicios Turísticos',tipoIngreso:'Antiguo ingreso',fechaMatricula:'22/10/2026',horaMatricula:'08:54 PM',responsable:'María Santos Ortiz Ávalos',telefonoResponsable:'2312-3123',correoResponsable:'maria.ortiz@gmail.com'}})}}};`);
    if(['/supabase-data.js','/Nuevo_ingreso/api-publica.js'].includes(nombre)) return res.end(`export async function obtenerSupabase(){return (await import('./supabase-config.js')).supabase;} export async function crearMatricula(){throw Error('No escribir datos en esta prueba');} export async function nieYaExiste(){return false;}`);
    const archivo = path.resolve(raiz,'.'+nombre);
    if(!archivo.startsWith(raiz+path.sep) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()){res.writeHead(404);return res.end();}
    let contenido=fs.readFileSync(archivo);
    if(nombre.endsWith('/nuevo_ingreso.js')) contenido=contenido.toString()+'\nwindow.prepararPDF=mostrarComprobanteMatricula;';
    res.end(contenido);
  });
  await new Promise(r=>servidor.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${servidor.address().port}/Nuevo_ingreso/`;
  let navegador;
  const valores = ['FIC-2027-388','342424234324','Manuel Antonio Cordero Ávalos','Tercer Año','Servicios Turísticos','Antiguo ingreso','22/10/2026','08:54 PM','María Santos Ortiz Ávalos','2312-3123','maria.ortiz@gmail.com'];
  const etiquetas = ['Número de ficha','NIE','Estudiante','Grado','Especialidad','Tipo de ingreso','Fecha de matrícula','Hora','Responsable','Teléfono del responsable','Correo del responsable'];

  async function verificar(descarga,nombre) {
    assert.equal(await descarga.failure(),null);
    const archivo=path.join(salida,nombre);
    await descarga.saveAs(archivo);
    const pdf=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(archivo)),useSystemFonts:true}).promise;
    assert.equal(pdf.numPages,1,'el comprobante debe ocupar una página');
    const pagina=await pdf.getPage(1);
    const vista=pagina.getViewport({scale:1});
    assert.ok(Math.abs(vista.width-595.28)<1 && Math.abs(vista.height-841.89)<1,'formato A4');
    const texto=await pagina.getTextContent();
    const contenido=texto.items.map(i=>i.str).join(' ').replace(/\s+/g,' ');
    for(const valor of [...etiquetas,...valores,'Comprobante de matrícula','Instituto Nacional de Comercio']) assert.ok(contenido.includes(valor),`${nombre}: falta ${valor}`);
    for(const item of texto.items.filter(i=>i.str.trim())) {
      assert.ok(item.transform[4] >= 35, `${nombre}: texto recortado a la izquierda`);
      assert.ok(item.transform[4]+item.width <= vista.width-35,`${nombre}: texto recortado a la derecha`);
      assert.ok(item.transform[5] >= 25 && item.transform[5] <= vista.height-35,`${nombre}: texto fuera de la página`);
    }
    await pdf.destroy();
  }

  try {
    navegador=await chromium.launch({executablePath:process.env.TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
    for(const html of ['nuevo_ingreso.html','FORMULARIO.html']) {
      for(const ancho of [360,390,1366]) {
        const pagina=await navegador.newPage({viewport:{width:ancho,height:740},acceptDownloads:true});
        const errores=[];
        pagina.on('pageerror',e=>errores.push(e.message));
        await pagina.route('https://**/*',r=>r.abort());
        await pagina.goto(url+html);
        await pagina.waitForFunction(()=>window.prepararPDF && document.querySelector('form').dataset.borradorListo === 'true');
        await pagina.evaluate(() => {
          window.prepararPDF({numeroFicha:'FIC-2027-388',nie:'342424234324',primerNombre:'Manuel',segundoNombre:'Antonio',primerApellido:'Cordero',segundoApellido:'Ávalos',grado:'Tercer Año',especialidad:'Servicios Turísticos',tipoIngreso:'Antiguo ingreso',fechaMatricula:'22/10/2026',horaMatricula:'08:54 PM',responsable:'María Santos Ortiz Ávalos',telefonoResponsable:'2312-3123',correoResponsable:'maria.ortiz@gmail.com'});
          document.getElementById('numeroFicha').value='FIC-2027-388';
          document.querySelector('form').hidden=true;
          document.getElementById('matriculaFinalizada').hidden=false;
          document.body.classList.add('tema-oscuro');
          window.scrollTo(0,document.body.scrollHeight);
        });
        const descargando=pagina.waitForEvent('download');
        await pagina.locator('#btnDescargarComprobante').click();
        const descarga=await descargando;
        assert.equal(descarga.suggestedFilename(),'Comprobante-Matricula-FIC-2027-388.pdf');
        await verificar(descarga,`${html.replace('.html','')}-${ancho}.pdf`);
        assert.deepEqual(errores,[]);
        await pagina.close();
      }
    }
    for(const ancho of [360,1366]) {
      const pagina=await navegador.newPage({viewport:{width:ancho,height:740},acceptDownloads:true});
      await pagina.route('https://**/*',r=>r.abort());
      await pagina.goto(url+'recuperar-comprobante.html');
      await pagina.locator('#nie').fill('342424234324');
      await pagina.locator('#nacimiento').fill('2009-11-14');
      await pagina.locator('#dui').fill('01234567-8');
      await pagina.locator('#buscar').click();
      await pagina.locator('#resultado').waitFor({state:'visible'});
      const descargando=pagina.waitForEvent('download');
      await pagina.locator('#pdf').click();
      await verificar(await descargando,`recuperado-${ancho}.pdf`);
      await pagina.close();
    }
  } finally { await navegador?.close(); await new Promise(r=>servidor.close(r)); }
});
