const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {createRequire}=require('node:module');
const {chromium}=createRequire('C:/Users/consu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const root=path.resolve(__dirname,'..');
const ficha={id:'test',paisNacimiento:'El Salvador',tipoModalidad:'Modalidad Regular',alumnoId:'alumno-test',numeroFicha:'20270001',fechaMatricula:'23/10/2026',nie:'123456789012',primerNombre:'María',segundoNombre:'Isabel',primerApellido:'Hernández',segundoApellido:'Martínez',fechaNacimiento:`${new Date().getFullYear()-16}-01-01`,edad:16,lugarNacimiento:'Santa Tecla - La Libertad Sur',sexo:'Femenino',grado:'Primer Año',especialidad:'Bachillerato General',tipoIngreso:'Nuevo ingreso',ultimoAnioAprobado:'Noveno Grado',colegioAnterior:'Instituto Nacional',telefonoEstudiante:'2457-8913',correoEstudiantil:'123456789012@clases.edu.sv',correoPersonal:'maria@gmail.com',hermanosCentroeducativo:'No',computadoraMineducyt:'Sí',internet:'Sí',tallaBlusa:'M',tallaFalda:'S',tallaZapatos:'36',tipoTransporte:'Público',distanciaKm:'3.5',zonaResidencia:'Urbana',conQuienVive:'Ambos',direccionResidencia:'Colonia Las Flores, Santa Tecla',enfermedad:'No',responsable:'Ana María',parentesco:'Mamá',duiResponsable:'12345678-9',telefonoResponsable:'7123-4568',whatsappResponsable:'7123-4568',correoResponsable:'ana@gmail.com',madreNombre:'Ana María',madreOcupacion:'Docente',madreLugarTrabajo:'Instituto Nacional',madreDui:'12345678-9',madreCelular:'7123-4568',padreNombre:'José Manuel',padreOcupacion:'Comerciante',padreLugarTrabajo:'Mercado Central',padreDui:'23456789-0',padreCelular:'7234-5679',fotoEstudiante:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZk0AAAAASUVORK5CYII='};
test('Administrador: restricciones, dependencias y guardado del formulario',async()=>{
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');const name=decodeURIComponent(url.pathname);
  res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'text/javascript; charset=utf-8');
  if(name==='/auth-guard.js')return res.end('export async function protegerRuta(){return true} export function cerrarSesionSupabase(){}');
  if(name==='/supabase-data.js')return res.end(`export async function buscarMatriculaPorNie(nie){if(window.__falloNie)throw Error('sin conexión');return nie===window.__registro.nie?window.__registro:null} export async function actualizarMatricula(r,c){window.__guardados.push(c);Object.assign(window.__registro,c)} export async function obtenerPerfil(){return null} export async function listarMatriculas(){return [window.__registro]} export async function obtenerMatriculasParaExcel(ids){window.__idsExcel=ids;return [{...window.__registro,datosCompletos:{id:window.__registro.id,alumnos:{id:"interno"}}}]} export async function revisarMatricula(id,completa){Object.assign(window.__registro,{revisionCompleta:completa,revisadoEn:new Date().toISOString(),revisadoPorNombre:"Administración"});return {id,revision_completa:completa}} export async function crearUsuario(datos){window.__usuarios??=[];if(window.__errorUsuario)throw Error("Correo ya registrado");window.__usuarios.push({...datos,id:"usuario-prueba"});return {...datos,id:"usuario-prueba"}} export async function listarUsuarios(){return window.__usuarios||[]} export async function crearDocente(){} export async function eliminarMatricula(){} export async function listarDocentes(){return []}`);
  if(name==='/ficha-oficial.js')return res.end('export function mostrarFichaOficial(){} export async function imprimirFichaOficial(){}');
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
  await page.waitForFunction(()=>typeof window.buscarMatricula==='function',null,{timeout:10000}).catch(e=>{throw new Error(e.message+'; errores del navegador: '+JSON.stringify(errors))});
  await page.locator('#buscarInput').fill(ficha.nie);await page.evaluate(()=>window.buscarMatricula());
  await page.evaluate(()=>window.modificarcampos());
  assert.equal(await page.locator('#r_paisNacimiento').inputValue(),'El Salvador');
  assert.equal(await page.locator('#r_tipoModalidad').inputValue(),'Modalidad Regular');
  assert.equal(await page.locator('select[data-para-input="r_tipoModalidad"] option').count(),3);
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
  if(process.env.INCO_REVISION_PREVIEW) await page.locator('.revision-tarjeta').first().screenshot({path:process.env.INCO_REVISION_PREVIEW});
  assert.match(await page.locator('#cuerpoTablaMatriculados').textContent(),/No hay estudiantes/);
  await page.evaluate(async()=>{
    window.__registro.documentosChecklist={tipo:'primer_nuevo',principal:Array.from({length:6},()=>({marcado:true})),general:Array.from({length:4},()=>({marcado:true})),actaCoordinador:{solvente:true}};
    await window.buscarReportes();
  });
  // Los documentos completos no sustituyen la revisión final del administrador.
  assert.equal(await page.locator('#cuerpoTablaReportes tr select').count(),1);
  await page.locator('#cuerpoTablaReportes tr select').selectOption('completo');
  await page.locator('#cuerpoTablaReportes').getByRole('button',{name:'Guardar revisión'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('#cuerpoTablaMatriculados tr select').length===1);
  assert.match(await page.locator('#cuerpoTablaReportes').textContent(),/No hay estudiantes/);
  assert.match(await page.locator('#cuerpoTablaMatriculados').textContent(),/Lucía/);
  assert.match(await page.locator('#cuerpoTablaMatriculados').textContent(),/Administración/);
  await page.locator('#cuerpoTablaMatriculados tr select').selectOption('incompleto');
  await page.locator('#cuerpoTablaMatriculados').getByRole('button',{name:'Guardar revisión'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('#cuerpoTablaReportes tr select').length===1);
  assert.match(await page.locator('#cuerpoTablaMatriculados').textContent(),/No hay estudiantes/);
  // Comprobar filtros combinados y exportación con las mismas filas seleccionadas.
  await page.evaluate(async()=>{
    window.__registro.grado='Primer Año';window.__registro.especialidad='Administrativo Contable';
    document.getElementById('filtroGrado').value='Primer Año';
    document.getElementById('filtroEspecialidad').value='Bachillerato Técnico Vocacional en Gestión Organizacional';
    await window.buscarReportes();
  });
  assert.match(await page.locator('#mensajeReportes').textContent(),/1 resultado/);
  await page.evaluate(async()=>{
    window.XLSX={utils:{aoa_to_sheet(datos){return {datos}},encode_col(){return 'BZ'},book_new(){return {hojas:[]}},book_append_sheet(libro,hoja,nombre){libro.hojas.push({nombre,...hoja})}},writeFile(libro){window.__excel=libro}};
    await window.descargarReporteExcel();
  });
  const excel=await page.evaluate(()=>window.__excel);
  assert.equal(excel.hojas.length,2);
  assert.ok(excel.hojas[0].datos[1].includes('Teléfono del responsable'));
  assert.ok(!excel.hojas[0].datos[1].some(h=>/base64|alumno_id|^ID$/i.test(h)));
  assert.equal(excel.hojas[1].datos[2][2],1);
  await page.evaluate(async()=>{document.getElementById('filtroGrado').value='Tercer Año';await window.buscarReportes();});
  assert.match(await page.locator('#mensajeReportes').textContent(),/No se encontraron/);
  assert.equal(await page.locator('#btnDescargarReporteExcel').isDisabled(),true);
  await page.evaluate(async()=>{
    window.__registro.grado='Tercer Año';window.__registro.especialidad='Desarrollo de Software';
    document.getElementById('filtroEspecialidad').value='Bachillerato Técnico Vocacional en Desarrollo de Software y Servicios Digitales';
    await window.buscarReportes();
  });
  assert.match(await page.locator('#mensajeReportes').textContent(),/1 resultado/);
  await page.evaluate(()=>window.mostrarDocentes());
  for(const rol of ['administrador','coordinador','docente']) {
    await page.evaluate(()=>window.abrirNuevoUsuario());
    await page.locator('#nuevoUsuarioNombre').fill('Persona de prueba');
    await page.locator('#nuevoUsuarioCorreo').fill(rol+'@example.com');
    await page.locator('#nuevoUsuarioContrasena').fill('Prueba12345');
    await page.locator('#nuevoUsuarioRol').selectOption(rol);
    await page.locator('#btnCrearDocente').click();
    await page.waitForFunction(()=>document.getElementById('mensajeNuevoUsuario').textContent.includes('Usuario creado correctamente'));
    await page.waitForFunction(()=>!document.getElementById('modalNuevoUsuario').classList.contains('activo'));
    assert.equal(await page.evaluate(()=>window.__usuarios.at(-1).rol),rol);
  }
  assert.equal(await page.locator('#cuerpoTablaDocentes tr').count(),3);
  assert.match(await page.locator('#cuerpoTablaDocentes').textContent(),/Administrador/);
  assert.match(await page.locator('#cuerpoTablaDocentes').textContent(),/Coordinador/);
  await page.evaluate(()=>{window.__errorUsuario=true;window.abrirNuevoUsuario()});
  await page.locator('#nuevoUsuarioNombre').fill('Duplicado');
  await page.locator('#nuevoUsuarioCorreo').fill('docente@example.com');
  await page.locator('#nuevoUsuarioContrasena').fill('Prueba12345');
  await page.locator('#btnCrearDocente').click();
  await page.waitForFunction(()=>document.getElementById('mensajeNuevoUsuario').textContent.includes('Correo ya registrado'));
  assert.equal(await page.locator('#btnCrearDocente').isDisabled(),false);
  assert.equal(await page.evaluate(()=>window.__usuarios.length),3);
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
});

