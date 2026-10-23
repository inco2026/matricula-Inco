const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {createRequire}=require('node:module');
const {chromium}=createRequire('C:/Users/consu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const root=path.resolve(__dirname,'..');
const ficha={id:'test',alumnoId:'alumno-test',numeroFicha:'20270001',fechaMatricula:'23/10/2026',nie:'123456789012',primerNombre:'María',segundoNombre:'Isabel',primerApellido:'Hernández',segundoApellido:'Martínez',fechaNacimiento:`${new Date().getFullYear()-16}-01-01`,edad:16,lugarNacimiento:'Santa Tecla - La Libertad Sur',sexo:'Femenino',grado:'Primer Año',especialidad:'Bachillerato General',tipoIngreso:'Nuevo ingreso',ultimoAnioAprobado:'Noveno Grado',colegioAnterior:'Instituto Nacional',telefonoEstudiante:'2457-8913',correoEstudiantil:'123456789012@clases.edu.sv',correoPersonal:'maria@gmail.com',hermanosCentroeducativo:'No',computadoraMineducyt:'Sí',internet:'Sí',tallaBlusa:'M',tallaFalda:'S',tallaZapatos:'36',tipoTransporte:'Público',distanciaKm:'3.5',zonaResidencia:'Urbana',conQuienVive:'Ambos',direccionResidencia:'Colonia Las Flores, Santa Tecla',enfermedad:'No',responsable:'Ana María',parentesco:'Mamá',duiResponsable:'12345678-9',telefonoResponsable:'7123-4568',whatsappResponsable:'7123-4568',correoResponsable:'ana@gmail.com',madreNombre:'Ana María',madreOcupacion:'Docente',madreLugarTrabajo:'Instituto Nacional',madreDui:'12345678-9',madreCelular:'7123-4568',padreNombre:'José Manuel',padreOcupacion:'Comerciante',padreLugarTrabajo:'Mercado Central',padreDui:'23456789-0',padreCelular:'7234-5679',fotoEstudiante:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZk0AAAAASUVORK5CYII='};
test('Administrador: restricciones, dependencias y guardado del formulario',async()=>{
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');const name=decodeURIComponent(url.pathname);
  res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'text/javascript; charset=utf-8');
  if(name==='/auth-guard.js')return res.end('export async function protegerRuta(){return true} export function cerrarSesionSupabase(){}');
  if(name==='/supabase-data.js')return res.end(`export async function buscarMatriculaPorNie(nie){if(window.__falloNie)throw Error('sin conexión');return nie===window.__registro.nie?window.__registro:null} export async function actualizarMatricula(r,c){window.__guardados.push(c);Object.assign(window.__registro,c)} export async function obtenerPerfil(){return null} export async function listarMatriculas(){return [window.__registro]} export async function crearDocente(){} export async function eliminarMatricula(){} export async function listarDocentes(){return []}`);
  if(name==='/ficha-oficial.js')return res.end('export function mostrarFichaOficial(){}');
  const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end();}
  let body=fs.readFileSync(file);
  if(name==='/Administrador/admin.html')body=body.toString().replace(/<script\b[^>]*src="https:[^"]*"[^>]*>[\s\S]*?<\/script>/g,'').replace('</head>',`<script>window.__registro=${JSON.stringify(ficha)};window.__guardados=[];</script></head>`);
  res.end(body);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/Administrador/admin.html`);
  await page.waitForFunction(()=>typeof window.buscarMatricula==='function');
  await page.locator('#buscarInput').fill(ficha.nie);await page.evaluate(()=>window.buscarMatricula());
  await page.evaluate(()=>window.modificarcampos());
  assert.equal(await page.locator('#r_primerNombre').getAttribute('maxlength'),'12');
  assert.equal(await page.locator('#r_nie').getAttribute('maxlength'),'12');
  assert.equal(await page.locator('#r_numeroFicha').evaluate(el=>el.readOnly),true);
  assert.equal(await page.locator('#r_correoEstudiantil').evaluate(el=>el.readOnly),true);
  assert.equal(await page.locator('select[data-para-input="r_sexo"] option').count(),3);
  await page.locator('#r_primerNombre').fill('Lucía');
  await page.evaluate(()=>window.modificarcampos());
  const guardados=await page.evaluate(()=>window.__guardados);assert.equal(guardados.length,1,await page.locator("#mensajeBusqueda").textContent()+" "+await page.locator(".error-campo").allTextContents());assert.equal(guardados[0].primerNombre,'Lucía');
  await page.evaluate(()=>window.modificarcampos());
  await page.locator('#r_nie').fill('0000000');await page.evaluate(()=>window.modificarcampos());
  assert.match(await page.locator('.error-campo').first().textContent(),/NIE/);assert.equal(await page.evaluate(()=>window.__guardados.length),1);
  await page.locator('#r_nie').fill(ficha.nie);
  await page.locator('select[data-para-input="r_grado"]').selectOption('Tercer Año');
  assert.equal(await page.locator('select[data-para-input="r_especialidad"] option[value="Bachillerato General"]').evaluate(el=>el.disabled),true);
  await page.evaluate(()=>window.modificarcampos());
  assert.match(await page.locator('#r_fechaNacimiento').locator('..').textContent(),/edad no está permitida/);
  await page.locator('select[data-para-input="r_grado"]').selectOption('Primer Año');
  await page.locator('#r_padreDui').fill(ficha.madreDui);await page.evaluate(()=>window.modificarcampos());
  assert.match(await page.locator('#r_padreDui').locator('..').textContent(),/no puede ser el mismo/);
  await page.locator('#r_padreDui').fill(ficha.padreDui);
  await page.locator('#r_nie').fill('123456789011');await page.evaluate(()=>{window.__falloNie=true});await page.evaluate(()=>window.modificarcampos());
  assert.match(await page.locator('#r_nie').locator('..').textContent(),/No se pudo verificar/);assert.equal(await page.evaluate(()=>window.__guardados.length),1);
  await page.evaluate(()=>{window.__falloNie=false});
  await page.locator('#r_nie').fill(ficha.nie);
  await page.locator('select[data-para-input="r_conQuienVive"]').selectOption('Otros');
  await page.locator('#r_conQuienViveOtro').fill('Hermana');
  await page.locator('#fotoAdministrador').setInputFiles({name:'documento.txt',mimeType:'text/plain',buffer:Buffer.from('texto')});
  await page.evaluate(()=>window.modificarcampos());
  assert.match(await page.locator('#mensajeBusqueda').textContent(),/JPG o PNG/);
  assert.equal(await page.evaluate(()=>window.__guardados.length),1);
  const png=await page.screenshot();
  await page.locator('#fotoAdministrador').setInputFiles({name:'foto.png',mimeType:'image/png',buffer:png});
  await page.evaluate(()=>window.modificarcampos());
  const segundo=await page.evaluate(()=>window.__guardados[1]);
  assert.equal(segundo.conQuienVive,'Otros: Hermana');
  assert.match(segundo.fotoEstudiante,/^data:image\/png;base64,/);
  assert.equal(await page.locator('#r_conQuienViveOtro').inputValue(),'Hermana');
  const limites=await page.evaluate(async()=>{
    const {errorCampo}=await import('./reglas-formulario.js');
    const casos=[
      ['primerNombre','Ana-María',{},false],
      ['primerNombre','Abcdefghijklm',{},true],
      ['telefonoEstudiante','1111-1111',{},true],
      ['madreCelular','2457-8913',{},true],
      ['correoResponsable','abcdefghijklmnop@gmail.com',{},true],
      ['duiEstudiante','',{edad:'18'},true],
      ['duiEstudiante','',{edad:'17'},false],
      ['tallaZapatos','46',{},true],
      ['direccionResidencia','Calle',{ },true],
      ['lugarNacimiento','Ciudad inventada',{},true],
      ['nombresHermanos','Ana; José; Juan; Rosa',{hermanosCentroeducativo:'Sí'},true]
    ];
    return casos.map(([k,v,d,esperado])=>({k,correcto:Boolean(errorCampo(k,v,d))===esperado}));
  });
  assert.ok(limites.every(c=>c.correcto),JSON.stringify(limites));
  await page.evaluate(async()=>{window.mostrarReportes();await window.buscarReportes();});
  assert.match(await page.locator('#mensajeReportes').textContent(),/1 resultado/);
  assert.equal(await page.locator('#cuerpoTablaReportes tr').count(),1);
  assert.match(await page.locator('#cuerpoTablaMatriculados').textContent(),/No hay estudiantes/);
  await page.evaluate(async()=>{
    window.__registro.documentosChecklist={tipo:'primer_nuevo',principal:Array.from({length:6},()=>({marcado:true})),general:Array.from({length:4},()=>({marcado:true})),actaCoordinador:{solvente:true}};
    await window.buscarReportes();
  });
  assert.match(await page.locator('#cuerpoTablaReportes').textContent(),/No hay estudiantes/);
  assert.match(await page.locator('#cuerpoTablaMatriculados').textContent(),/Lucía/);
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
});

