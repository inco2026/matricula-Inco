const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {createRequire}=require('node:module');
const {chromium}=createRequire('C:/Users/28913/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const root=path.resolve(__dirname,'..');
const ficha={id:'test',alumnoId:'alumno-test',numeroFicha:'20270001',fechaMatricula:'23/10/2026',nie:'123456789012',primerNombre:'María',segundoNombre:'Isabel',primerApellido:'Hernández',segundoApellido:'Martínez',fechaNacimiento:`${new Date().getFullYear()-16}-01-01`,edad:16,lugarNacimiento:'Santa Tecla - La Libertad Sur',sexo:'Femenino',grado:'Primer Año',especialidad:'Bachillerato General',tipoIngreso:'Nuevo ingreso',ultimoAnioAprobado:'Noveno Grado',colegioAnterior:'Instituto Nacional',telefonoEstudiante:'2457-8913',correoEstudiantil:'123456789012@clases.edu.sv',correoPersonal:'maria@gmail.com',hermanosCentroeducativo:'No',computadoraMineducyt:'Sí',internet:'Sí',tallaBlusa:'M',tallaFalda:'S',tallaZapatos:'36',tipoTransporte:'Público',distanciaKm:'3.5',zonaResidencia:'Urbana',conQuienVive:'Ambos',direccionResidencia:'Colonia Las Flores, Santa Tecla',enfermedad:'No',responsable:'Ana María',parentesco:'Mamá',duiResponsable:'12345678-9',telefonoResponsable:'7123-4568',whatsappResponsable:'7123-4568',correoResponsable:'ana@gmail.com',madreNombre:'Ana María',madreOcupacion:'Docente',madreLugarTrabajo:'Instituto Nacional',madreDui:'12345678-9',madreCelular:'7123-4568',padreNombre:'José Manuel',padreOcupacion:'Comerciante',padreLugarTrabajo:'Mercado Central',padreDui:'23456789-0',padreCelular:'7234-5679',fotoEstudiante:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZk0AAAAASUVORK5CYII='};
test('Coordinador: docente responsable y autollenado Arial 12 centrado',async()=>{
 ficha.documentosChecklist={revisadoPorNombre:'Ana Docente'};
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');const name=decodeURIComponent(url.pathname);
  res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'text/javascript; charset=utf-8');
  if(name==='/auth-guard.js')return res.end('export async function protegerRuta(){return true} export function cerrarSesionSupabase(){}');
  if(name==='/supabase-data.js')return res.end(`export async function guardarDocumentos(r,d){window.__saveCount=(window.__saveCount||0)+1;window.__registro.documentosChecklist=d} export async function buscarMatriculaPorNie(nie){if(window.__falloNie)throw Error('sin conexión');return nie===window.__registro.nie?window.__registro:null} export async function actualizarMatricula(r,c){window.__guardados.push(c);Object.assign(window.__registro,c)} export async function obtenerPerfil(){return window.__perfil||null} export async function listarMatriculas(){return [window.__registro]} export async function crearDocente(){} export async function eliminarMatricula(){} export async function listarDocentes(){return []}`);

  const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end();}
  let body=fs.readFileSync(file);
  if(name==='/Coordinador/coordinador.html')body=body.toString().replace(/<script\b[^>]*src="https:[^"]*"[^>]*>[\s\S]*?<\/script>/g,'').replace('</head>',`<script>window.__registro=${JSON.stringify(ficha)};window.__guardados=[];</script></head>`);
  res.end(body);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const avisos=[]; page.on('dialog',async d=>{avisos.push(d.message());await d.accept();});
  await page.goto(`http://127.0.0.1:${server.address().port}/Coordinador/coordinador.html`);
  await page.waitForFunction(()=>document.querySelector('#botonConsulta').disabled===false);
  await page.locator('#nieConsulta').fill(ficha.nie);
  await page.waitForFunction(()=>document.querySelector('#actaAlumno').value.includes('María'));
  assert.equal(await page.locator('#actaEncargado').inputValue(),ficha.responsable);
  assert.equal(await page.locator('#actaDui').inputValue(),ficha.duiResponsable);
  assert.match(await page.locator('#fichaConsulta .fo-firmas').textContent(),/Ana Docente/);
  const estilos=await page.locator('#actaAlumno').evaluate(el=>({fuente:getComputedStyle(el).fontFamily,tamano:getComputedStyle(el).fontSize,alineacion:getComputedStyle(el).textAlign}));
  assert.match(estilos.fuente,/Arial/);assert.equal(estilos.tamano,'16px');assert.equal(estilos.alineacion,'center');
  assert.equal(await page.locator('#actaMadre').inputValue(),'X');
  assert.equal(await page.locator('#actaNombreCoordinador').inputValue(),'Alvaro francisco Solorzano Deodanes');
  assert.equal(await page.locator('#actaCondicionamiento ol li').count(),13);
  assert.equal(await page.locator('#fichaConsulta .fo-logo').evaluate(el=>el.complete && el.naturalWidth > 0),true);
  assert.equal(await page.locator('#actaCondicionamiento [contenteditable]').count(),0);
  assert.equal(await page.locator('#actaSeccion').inputValue(),'');
  assert.equal(await page.locator('#actaDuiFirmaEstudiante').inputValue(),'');
  await page.locator('#actaAnio').fill('2001');
  await page.locator('#actaNombreCoordinador').fill('Coordinador de prueba');
  await page.locator('#guardarActa').click();
  await page.waitForFunction(()=>document.querySelector('#estadoConsulta').textContent.startsWith('Acta guardada'));
  assert.equal(await page.locator('#actaEncargado').evaluate(el=>el.readOnly),true);
  assert.equal(await page.locator('#guardarActa').isDisabled(),false);
  await page.evaluate(()=>document.querySelector('#guardarActa').dispatchEvent(new Event('click')));
  assert.equal(await page.evaluate(()=>window.__saveCount),1);
  assert.match(avisos.at(-1),/ya está guardada/);
  await page.locator('#botonConsulta').click();
  await page.waitForFunction(()=>document.querySelector('#estadoConsulta').textContent.startsWith('Acta guardada recuperada'));
  assert.equal(await page.locator('#actaNombreCoordinador').inputValue(),'Coordinador de prueba');
  assert.equal(await page.locator('#actaAnio').inputValue(),String(new Date().getFullYear()));
  assert.equal(await page.evaluate(()=>window.__registro.documentosChecklist.actaCoordinador.campos.actaSeccion),'');
  assert.equal(await page.evaluate(()=>window.__registro.documentosChecklist.actaCoordinador.campos.actaDuiFirmaEstudiante),'');
  assert.equal(await page.locator('#guardarActa').isDisabled(),false);
  await page.locator('#modificarActa').click();
  assert.equal(await page.locator('#guardarActa').isDisabled(),false);
  await page.locator('#guardarActa').click();
  assert.match(avisos.at(-1),/No hay cambios/);
  assert.equal(await page.evaluate(()=>window.__saveCount),1);
  await page.locator('#actaEncargado').fill('Ana María de los Ángeles Hernández Rodríguez');
  assert.equal(await page.locator('#actaFirmaEncargado').inputValue(),'Ana María de los Ángeles Hernández Rodríguez');
  assert.equal(await page.locator('#guardarActa').isDisabled(),false);
  await page.locator('#guardarActa').click();
  await page.waitForFunction(()=>window.__saveCount===2);
  assert.equal(await page.locator('#guardarActa').isDisabled(),false);
  await page.setViewportSize({width:725,height:1056});
  await page.emulateMedia({media:'print'});
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  await page.locator('#actaCondicionamiento').screenshot({path:'C:/Users/28913/Downloads/acta-compromiso-revision.png'});
  assert.equal(await page.locator('#actaAlumno').evaluate(el=>getComputedStyle(el).display),'none');
  assert.equal(await page.locator('#actaAlumno').evaluate(el=>getComputedStyle(el).textAlign),'center');
  const pdf=await page.pdf({preferCSSPageSize:true});
  const paginas=(pdf.toString('latin1').match(/\/Type \/Page\b/g)||[]).length;
  assert.equal(paginas,1,'El acta debe caber en una hoja sin reducir Arial 12 '+JSON.stringify(await page.locator('#actaCondicionamiento').evaluate(el=>({alto:el.getBoundingClientRect().height,ancho:el.getBoundingClientRect().width,hijos:Array.from(el.children).map(n=>({tipo:n.tagName,clase:n.className,alto:n.getBoundingClientRect().height}))}))));
  await page.emulateMedia({media:'screen'});
  await page.evaluate(()=>{
    window.__registro.documentosChecklist={actualizadoPor:'docente-id'};
    window.__perfil={nombre:'Docente del perfil',rol:'docente'};
    document.querySelector('#buscarMatriculaCoordinador').requestSubmit();
  });
  await page.waitForFunction(()=>document.querySelector('#fichaConsulta').textContent.includes('Docente del perfil'));
  assert.match(await page.locator('#fichaConsulta .fo-firmas').textContent(),/Docente del perfil/);
  await page.locator('#nieConsulta').fill('9999999');
  await page.waitForFunction(()=>document.querySelector('#estadoConsulta').textContent.includes('No se encontró'));
  assert.equal(await page.locator('#actaAlumno').inputValue(),'');
  assert.equal(await page.locator('#guardarActa').evaluate(el=>el.disabled),true);
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
});




