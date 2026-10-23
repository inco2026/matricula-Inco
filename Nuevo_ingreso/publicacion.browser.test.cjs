const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {createRequire} = require('node:module');
const runtime = process.env.CODEX_NODE_MODULES || 'C:/Users/28913/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium} = createRequire(path.join(runtime,'playwright','package.json'))('playwright');

test('matrícula funciona publicando solo su carpeta, sin dependencias de administración', async () => {
  const solicitudes = [];
  const servidor = http.createServer((req,res) => {
    const url = new URL(req.url,'http://localhost');
    solicitudes.push(url.pathname);
    // Simula una carpeta subida dentro del repositorio y otra publicada como raíz.
    const prefijo = ['/repositorio/Nuevo_ingreso/','/solo-matricula/'].find(p => url.pathname.startsWith(p));
    if(!prefijo) {res.writeHead(404);return res.end();}
    let nombre = decodeURIComponent(url.pathname.slice(prefijo.length)) || 'index.html';
    const raizPaquete=path.join(__dirname,'publicar','Nuevo_ingreso');
    const archivo=path.resolve(raizPaquete,nombre);
    if(!archivo.startsWith(raizPaquete+path.sep)||!fs.existsSync(archivo)||fs.statSync(archivo).isDirectory()){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type', /\.(m?js)$/.test(nombre)?'text/javascript':nombre.endsWith('.css')?'text/css':nombre.endsWith('.png')?'image/png':'text/html');
    if(nombre==='supabase-config.js')return res.end(`export const supabase={rpc:async(nombre,{p}={})=>{window.ultimoRPC={nombre,p};return {data:nombre==='nie_ya_existe'?false:'id-prueba'};}};`);
    res.end(fs.readFileSync(archivo));
  });
  await new Promise(r=>servidor.listen(0,'127.0.0.1',r));
  let navegador;
  try {
    navegador=await chromium.launch({executablePath:process.env.TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
    for(const prefijo of ['/repositorio/Nuevo_ingreso/','/solo-matricula/']) {
      const pagina=await navegador.newPage({viewport:{width:390,height:844}});
      const errores=[]; const fallos=[];
      pagina.on('pageerror',e=>errores.push(e.message));
      pagina.on('response',r=>{if(r.status()>=400)fallos.push(r.url());});
      await pagina.route('https://**/*',r=>r.abort());
      const base=`http://127.0.0.1:${servidor.address().port}${prefijo}`;
      await pagina.goto(base);
      assert.equal(await pagina.getByRole('link',{name:'Matrícula',exact:true}).count(),1);
      assert.equal(await pagina.locator('a,button').count(),1,'la bienvenida pública solo muestra Matrícula');
      assert.ok(await pagina.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      fs.mkdirSync(path.join(__dirname,'tmp'),{recursive:true});
      await pagina.screenshot({path:path.join(__dirname,'tmp','inicio-estudiantes-movil.png'),fullPage:true});
      await pagina.getByRole('link',{name:'Matrícula',exact:true}).click();
      await pagina.waitForURL('**/nuevo_ingreso.html');
      await pagina.waitForFunction(()=>document.querySelector('form').dataset.borradorListo==='true');
      assert.equal(await pagina.getByRole('button',{name:/administrador/i}).count(),0,'la entrada pública no ofrece acceso al personal');
      const alerta=pagina.waitForEvent('dialog');
      const pulsacion=pagina.locator('#btnSiguiente').click();
      const dialogo=await alerta;
      assert.equal(dialogo.message(),'Revise los campos marcados en el paso 1.');
      await dialogo.accept();
      await pulsacion;
      await pagina.locator('#telefonoEstudiante').fill('9348-9261');
      assert.equal(await pagina.locator('#telefonoEstudiante').getAttribute('aria-invalid'),'true');
      await pagina.locator('#telefonoEstudiante').fill('5348-9261');
      assert.equal(await pagina.locator('#telefonoEstudiante').getAttribute('aria-invalid'),null);
      await pagina.evaluate(async () => {
        const {crearMatricula}=await import('./api-publica.js');
        await crearMatricula({telefonoEstudiante:'5348-9261',disponibilidadDocumentos:{documentos:[]}});
      });
      assert.equal(await pagina.evaluate(()=>window.ultimoRPC.nombre),'crear_matricula_con_documentos');
      assert.ok(await pagina.locator('.banner').evaluate(el=>el.complete&&el.naturalWidth>0),'el encabezado está dentro de la carpeta');
      await pagina.goto(base+'recuperar-comprobante.html');
      await pagina.getByRole('link',{name:'Volver al inicio'}).click();
      await pagina.waitForURL('**/index.html');
      assert.equal(await pagina.getByRole('link',{name:'Matrícula',exact:true}).count(),1);
      assert.deepEqual(errores,[]);
      assert.deepEqual(fallos,[]);
      assert.ok(solicitudes.every(s=>s.startsWith('/repositorio/Nuevo_ingreso/')||s.startsWith('/solo-matricula/')),'ninguna petición sale de la carpeta pública');
      await pagina.close();
    }
  } finally { await navegador?.close();await new Promise(r=>servidor.close(r)); }
});

test('enlace de personal independiente: acceso por rol y protección sin sesión',async()=>{
  const raiz=path.resolve(__dirname,'..');
  const servidor=http.createServer((req,res)=>{
    const nombre=new URL(req.url,'http://localhost').pathname;
    res.setHeader('Content-Type',nombre.endsWith('.js')?'text/javascript':nombre.endsWith('.css')?'text/css':nombre.endsWith('.png')?'image/png':'text/html');
    if(nombre==='/supabase-config.js')return res.end(`export const supabase={auth:{getSession:async()=>({data:{session:null}}),signInWithPassword:async()=>({data:{user:{id:'prueba'}}}),signOut:async()=>({})},from(){return {select(){return {eq(){return {single:async()=>({data:{nombre:'Personal de prueba',rol:'administrador'}})}}}}}}};`);
    if(['/Administrador/admin.html','/Docente/docente.html','/Coordinador/coordinador.html'].includes(nombre))return res.end('<script type="module">import {protegerRuta} from "/auth-guard.js"; protegerRuta("administrador");</script>');
    const archivo=path.resolve(raiz,'.'+nombre);
    if(!archivo.startsWith(raiz+path.sep)||!fs.existsSync(archivo)||fs.statSync(archivo).isDirectory()){res.writeHead(404);return res.end();}
    res.end(fs.readFileSync(archivo));
  });
  await new Promise(r=>servidor.listen(0,'127.0.0.1',r));
  let navegador;
  try {
    navegador=await chromium.launch({executablePath:process.env.TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
    const pagina=await navegador.newPage({viewport:{width:390,height:844}});
    const base=`http://127.0.0.1:${servidor.address().port}`;
    await pagina.goto(base+'/index.html');
    assert.equal(await pagina.getByRole('link',{name:'Matrícula',exact:true}).count(),1);
    assert.equal(await pagina.locator('a,button').count(),1,'la portada raíz también es exclusiva de estudiantes');
    await pagina.goto(base+'/Administrador/admin.html');
    await pagina.waitForURL('**/administracion.html');
    assert.equal(await pagina.getByRole('heading',{name:'Acceso del personal'}).count(),1);
    assert.equal(await pagina.getByRole('button',{name:/nuevo ingreso/i}).count(),0);
    await pagina.screenshot({path:path.join(__dirname,'tmp','inicio-personal-movil.png'),fullPage:true});
    await pagina.locator('#usuarioAdmin').fill('prueba@example.com');
    await pagina.locator('#passwordAdmin').fill('clave-simulada');
    // Observar la navegación de acceso sin entrar en un panel real.
    const acceso=pagina.waitForRequest(r=>new URL(r.url()).pathname==='/Administrador/admin.html');
    await pagina.getByRole('button',{name:'Acceder',exact:true}).click();
    await acceso;
    await pagina.waitForURL('**/administracion.html');
    assert.equal(await pagina.evaluate(()=>sessionStorage.getItem('rolUsuario')),'administrador');
    assert.ok(await pagina.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await pagina.close();
  }finally{await navegador?.close();await new Promise(r=>servidor.close(r));}
});
