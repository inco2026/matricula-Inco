const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { createRequire } = require('node:module');
const runtime = process.env.CODEX_NODE_MODULES || 'C:/Users/28913/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = createRequire(path.join(runtime, 'playwright', 'package.json'))('playwright');

test('límites, documentos, cámara, RPC y vistas móviles', async () => {
  const raiz = path.resolve(__dirname, '..');
  const servidor = http.createServer((req, res) => {
    const nombre = decodeURIComponent(req.url.split('?')[0]);
    res.setHeader('Content-Type', /\.(m?js)$/.test(nombre) ? 'text/javascript' : nombre.endsWith('.css') ? 'text/css' : 'text/html');
    if (['/supabase-config.js','/Nuevo_ingreso/supabase-config.js'].includes(nombre)) return res.end(`export const supabase={rpc:async(nombre,{p}={})=>{window.rpcUltima={nombre,p};return {data:nombre==='nie_ya_existe'?false:'00000000-0000-0000-0000-000000000001'};}};`);
    if (nombre === '/vista-ficha.html') return res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/ficha-oficial.css"><div id="contenidoImprimir"></div><script type="module">import {mostrarFichaOficial} from '/ficha-oficial.js'; window.mostrar=datos=>mostrarFichaOficial(document.getElementById('contenidoImprimir'),datos);</script>`);
    const archivo = path.resolve(raiz, '.' + nombre);
    if (!archivo.startsWith(raiz + path.sep) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) { res.writeHead(404); return res.end(); }
    let contenido = fs.readFileSync(archivo);
    if (nombre.endsWith('/nuevo_ingreso.js')) contenido = contenido.toString() + '\nwindow.pruebas={validarCampo,mostrarPaso,mostrarComprobanteMatricula,obtenerDisponibilidadDocumentos};';
    res.end(contenido);
  });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${servidor.address().port}`;
  let navegador;
  try {
    navegador = await chromium.launch({ executablePath: process.env.TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    for (const html of ['nuevo_ingreso.html', 'FORMULARIO.html']) {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      await pagina.route('https://**/*', ruta => ruta.abort());
      await pagina.goto(`${url}/Nuevo_ingreso/${html}`);
      await pagina.waitForFunction(() => document.querySelector('form').dataset.borradorListo === 'true');
      await pagina.locator('#primerNombre').fill('');
      await pagina.locator('#primerNombre').pressSequentially('Ana123');
      assert.equal(await pagina.locator('#primerNombre').inputValue(), 'Ana');
      const nombresSinNumeros = await pagina.evaluate(() => {
        const ids = ['primerNombre','segundoNombre','primerApellido','segundoApellido','responsable','madreNombre','padreNombre'];
        const hermano = document.createElement('input');
        hermano.className = 'hermano-nombre';
        document.getElementById('matriculaForm').append(hermano);
        const resultados = [...ids.map(id=>document.getElementById(id)), hermano].map(campo => {
          campo.value = 'José12３';
          campo.dispatchEvent(new Event('input',{bubbles:true}));
          const valor = campo.value;
          const datos = new DataTransfer(); datos.setData('text','Ana123');
          const pegado = new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:datos});
          campo.dispatchEvent(pegado);
          return [valor,pegado.defaultPrevented];
        });
        hermano.remove();
        return resultados;
      });
      assert.deepEqual(nombresSinNumeros, Array.from({length:8},()=>['José',true]));
      assert.equal(await pagina.locator('#correoPersonal').getAttribute('maxlength'), '35');
      assert.deepEqual(await pagina.locator('#madreLugarTrabajo,#padreLugarTrabajo').evaluateAll(els => els.map(el => el.maxLength)), [40,40]);
      assert.equal(await pagina.locator('#especialidad option[value="Administrativo Contable"]').textContent(), 'Bachilerato Técnico Vocaional en Gestión Organizacional (Administrativo Contable)');
      assert.equal(await pagina.locator('#especialidad option[value="Servicios Turísticos"]').textContent(), 'Bachillerato Técnico Vocacional en Servicios Turísticos');
      assert.equal(await pagina.locator('#especialidad option[value="Desarrollo de Software"]').textContent(), 'Bachillerato Técnico Vocacional en Desarrollo de Software y Servicios Digitales');
      const gradosGeneral = await pagina.evaluate(() => {
        const grado = document.getElementById('grado');
        const especialidad = document.getElementById('especialidad');
        return ['Primer Año','Segundo Año','Tercer Año'].map(valor => {
          grado.value = valor;
          grado.dispatchEvent(new Event('change', {bubbles:true}));
          return especialidad.querySelector('[value="Bachillerato General"]').disabled;
        });
      });
      assert.deepEqual(gradosGeneral, [false,false,true]);
      const nuevosCambios = await pagina.evaluate(() => {
        const grado = document.getElementById('grado');
        const tipo = document.getElementById('tipoIngreso');
        grado.value = 'Segundo Año'; grado.dispatchEvent(new Event('change'));
        tipo.value = 'Nuevo ingreso';
        grado.value = 'Primer Año'; grado.dispatchEvent(new Event('change'));
        const bloqueado = tipo.value === '' && tipo.querySelector('[value="Nuevo ingreso"]').disabled;
        tipo.value = 'Nuevo ingreso';
        const invalido = !window.pruebas.validarCampo(tipo,true);
        const opciones = Array.from(document.getElementById('conQuienVive').options).map(o=>o.value);
        const direccion = document.getElementById('direccionResidencia');
        direccion.value = 'calle Las Flores, casa 12'; direccion.dispatchEvent(new Event('input',{bubbles:true}));
        const celular = document.getElementById('madreCelular');
        celular.value = '8348-9261';
        return {bloqueado,invalido,tio:opciones.includes('Tío/a'),abuelo:opciones.includes('Abuelo/a'),direccion:direccion.value,celular:window.pruebas.validarCampo(celular,true)};
      });
      assert.deepEqual(nuevosCambios,{bloqueado:false,invalido:false,tio:true,abuelo:true,direccion:'Calle Las Flores, casa 12',celular:true});
      await pagina.evaluate(() => { const grado=document.getElementById('grado'); grado.value=''; grado.dispatchEvent(new Event('change',{bubbles:true})); });
      const telefonos = await pagina.evaluate(() => {
        const ids = ['telefonoEstudiante','telefonoResponsable','whatsappResponsable','madreCelular','padreCelular'];
        return ids.map(id => {
          const campo = document.getElementById(id);
          return [id, ...['2348-9261','5348-9261','6348-9261','7348-9261','9348-9261','6348-926'].map(valor => {
            campo.value = valor;
            return window.pruebas.validarCampo(campo,true);
          })];
        });
      });
      for (const [id,...acepta] of telefonos) assert.deepEqual(acepta,
        ['telefonoEstudiante','telefonoResponsable'].includes(id) ? [true,true,true,true,false,false] : [false,true,true,true,false,false], id);
      const autollenado = await pagina.evaluate(() => {
        // La normalización nunca debe convertir basura en un teléfono aceptable.
        for (const id of ['telefonoEstudiante','telefonoResponsable','whatsappResponsable','madreCelular','padreCelular']) {
          for (const valor of ['tel53489261','5348x9261','7777-7777','6767-6767','12345678','534892611']) {
            const campo = document.getElementById(id);
            campo.value = valor;
            campo.dispatchEvent(new Event('input',{bubbles:true}));
            if (window.pruebas.validarCampo(campo,true)) throw Error(id + ' aceptó ' + valor);
          }
          const campo = document.getElementById(id);
          const datos = new DataTransfer(); datos.setData('text','tel53489261');
          const pegado = new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:datos});
          campo.dispatchEvent(pegado);
          if (!pegado.defaultPrevented) throw Error(id + ' permite pegado inválido');
        }
        for (const id of ['nie','duiEstudiante','duiResponsable','madreDui','padreDui','distanciaKm']) {
          const evento = new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:'abc'});
          document.getElementById(id).dispatchEvent(evento);
          if (!evento.defaultPrevented) throw Error(id + ' permite letras');
        }
        for (const texto of ['123','@','<script>','😀']) {
          const evento = new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:texto});
          document.getElementById('primerNombre').dispatchEvent(evento);
          if (!evento.defaultPrevented) throw Error('Nombre permite ' + texto);
        }
        const asignar = (id, valor) => { const el = document.getElementById(id); el.value=valor; el.dispatchEvent(new Event('input',{bubbles:true})); };
        asignar('parentesco','Mamá');
        asignar('whatsappResponsable','');
        asignar('telefonoResponsable','2348-9261');
        const fijo = document.getElementById('madreCelular').value;
        asignar('whatsappResponsable','5348-9261');
        const movil = document.getElementById('madreCelular').value;
        asignar('parentesco','');
        return {fijo,movil};
      });
      assert.deepEqual(autollenado,{fijo:'',movil:'5348-9261'},'el teléfono fijo no se copia al campo celular de la madre');
      const limites = await pagina.evaluate(() => {
        const campo = document.getElementById('correoPersonal');
        const resultados = [35,36].map(n => { campo.value = 'a'.repeat(n - 10) + '@gmail.com'; return window.pruebas.validarCampo(campo, true); });
        return resultados;
      });
      assert.deepEqual(limites, [true,false]);
      await pagina.evaluate(() => window.pruebas.mostrarPaso(1));
      await pagina.locator('#correoPersonal').fill('ana@gmail.com');
      await pagina.locator('#correoPersonal').pressSequentially('abc');
      assert.equal(await pagina.locator('#correoPersonal').inputValue(), 'ana@gmail.com');
      await pagina.locator('#correoPersonal').pressSequentially('.sv');
      assert.equal(await pagina.locator('#correoPersonal').inputValue(), 'ana@gmail.com.sv');
      const repetidor = await pagina.evaluate(() => {
        const grado = document.getElementById('grado');
        const tipo = document.getElementById('tipoIngreso');
        grado.value = 'Primer Año'; grado.dispatchEvent(new Event('change'));
        tipo.value = 'Antiguo ingreso'; tipo.dispatchEvent(new Event('change'));
        const grupo = document.querySelector('.documentacion-grupo:not([hidden])');
        return {tipoValido:window.pruebas.validarCampo(tipo,true),grado:grupo?.dataset.grado,tipo:grupo?.dataset.tipo,documentos:grupo?.querySelectorAll('input').length};
      });
      assert.deepEqual(repetidor,{tipoValido:true,grado:'Primer Año',tipo:'Antiguo ingreso',documentos:6});
      await pagina.evaluate(() => {
        document.getElementById('grado').value = 'Tercer Año';
        document.getElementById('tipoIngreso').value = 'Antiguo ingreso';
        window.pruebas.mostrarPaso(6);
      });
      const checks = pagina.locator('.documentacion-grupo:not([hidden]) input');
      assert.deepEqual(await pagina.locator('.documentacion-grupo').evaluateAll(grupos => grupos.map(g => g.querySelectorAll('input').length)), [6,7,7,4,4,6], 'añade checks a todas las listas existentes');
      assert.equal(await checks.count(), 4);
      await checks.nth(0).check();
      await checks.nth(3).check();
      assert.deepEqual(await checks.evaluateAll(els => els.map(el => el.checked)), [true,false,false,true]);
      await pagina.reload();
      await pagina.waitForFunction(() => document.querySelector('form').dataset.borradorListo === 'true');
      assert.deepEqual(await checks.evaluateAll(els => els.map(el => el.checked)), [true,false,false,true], 'recupera los documentos 1 y 4');
      assert.match(await pagina.locator('.documentacion-grupo:not([hidden]) .documentacion-resumen').textContent(), /2 de 4 disponibles/);
      await pagina.evaluate(() => {
        const ingreso = document.getElementById('tipoIngreso');
        ingreso.value = 'Nuevo ingreso'; ingreso.dispatchEvent(new Event('change', {bubbles:true}));
      });
      assert.equal(await checks.count(), 7);
      assert.equal(await checks.filter({has:pagina.locator(':checked')}).count(), 0);
      await checks.nth(1).check();
      await pagina.evaluate(() => {
        const ingreso = document.getElementById('tipoIngreso');
        ingreso.value = 'Antiguo ingreso'; ingreso.dispatchEvent(new Event('change', {bubbles:true}));
      });
      assert.deepEqual(await checks.evaluateAll(els => els.map(el => el.checked)), [true,false,false,true], 'cada combinación mantiene sus checks');
      assert.equal(await pagina.evaluate(() => window.pruebas.validarCampo(document.querySelector('.documentacion-grupo:not([hidden]) input'))), true);
      const datos = await pagina.evaluate(async () => {
        const {crearMatricula} = await import('/supabase-data.js');
        const disponibilidadDocumentos = window.pruebas.obtenerDisponibilidadDocumentos();
        await crearMatricula({grado:'Tercer Año',tipoIngreso:'Antiguo ingreso',disponibilidadDocumentos});
        return window.rpcUltima;
      });
      assert.equal(datos.nombre, 'crear_matricula_con_documentos');
      assert.deepEqual(datos.p.disponibilidadDocumentos.documentos.map(d => d.disponible), [true,false,false,true]);
      await pagina.evaluate(() => window.pruebas.mostrarPaso(1));
      assert.equal(await pagina.locator('#fotoCamara').getAttribute('capture'), 'user');
      const elegido = pagina.waitForEvent('filechooser');
      await pagina.locator('#btnTomarFoto').click();
      assert.equal(await (await elegido).element().getAttribute('id'), 'fotoCamara');
      const foto = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMukAAAAASUVORK5CYII=', 'base64');
      await pagina.locator('#fotoCamara').setInputFiles({name:'camara.png',mimeType:'image/png',buffer:foto});
      await pagina.waitForFunction(() => document.getElementById('fotoEstudiante').dataset.estadoFoto === 'lista');
      assert.equal(await pagina.locator('#fotoEstudiante').evaluate(el => el.files[0].type), 'image/jpeg');
      await pagina.reload();
      await pagina.waitForFunction(() => document.querySelector('form').dataset.borradorListo === 'true');
      assert.equal(await pagina.locator('#fotoEstudiante').getAttribute('data-estado-foto'), 'lista', 'la foto de cámara se recupera');
      for (const ancho of [360,390,768,1366]) {
        await pagina.setViewportSize({width:ancho,height:844});
        for (let paso=1;paso<=6;paso++) {
          await pagina.evaluate(paso => window.pruebas.mostrarPaso(paso), paso);
          assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${html}: paso ${paso}, ancho ${ancho}, sin desbordamiento`);
        }
      }
      await pagina.setViewportSize({width:390,height:844});
      await pagina.screenshot({path:path.join(os.tmpdir(), 'matricula-documentos-movil.png'),fullPage:true});
      await pagina.evaluate(() => {
        window.pruebas.mostrarComprobanteMatricula({numeroFicha:'INCO-2027-ABCDEFGHIJK', primerNombre:'María',primerApellido:'Hernández',especialidad:'Administrativo Contable (Segundos y Terceros)',correoResponsable:'responsable@dominioejemplo.com'});
        document.getElementById('matriculaForm').hidden = true;
        document.getElementById('matriculaFinalizada').style.display = 'block';
      });
      assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'comprobante móvil sin recortes');
      await pagina.screenshot({path:path.join(os.tmpdir(), 'matricula-comprobante-movil.png'),fullPage:true});
      assert.deepEqual(errores, []);
      await pagina.close();
    }
    const pagina = await navegador.newPage({viewport:{width:360,height:800}});
    await pagina.goto(`${url}/vista-ficha.html`);
    await pagina.waitForFunction(() => window.mostrar);
    await pagina.evaluate(() => window.mostrar({numeroFicha:'INCO-2027-ABCDEFGHIJK',primerNombre:'María',primerApellido:'Hernández',madreLugarTrabajo:'Calle Autopista Comalapa, km 13/2',padreLugarTrabajo:'Instituto Nacional de Comercio',especialidad:'Administrativo Contable (Segundos y Terceros)',correoPersonal:'estudiante123456789012345@gmail.com',madreNombre:'Ana María Hernández',padreNombre:'José Antonio Martínez'}));
    assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'ficha oficial móvil sin desbordamiento');
    await pagina.screenshot({path:path.join(os.tmpdir(), 'matricula-ficha-movil.png'),fullPage:true});
    await pagina.emulateMedia({media:'print'});
    assert.ok(await pagina.locator('.ficha-oficial').evaluate(el => el.getBoundingClientRect().width > 700), 'impresión mantiene ancho de papel');
    await pagina.emulateMedia({media:'screen'});
    await pagina.route('https://**/*', ruta => ruta.abort());
    await pagina.route('**/auth-guard.js', ruta => ruta.fulfill({contentType:'text/javascript',body:'export async function protegerRuta(){return true;} export async function cerrarSesionSupabase(){}'}));
    await pagina.goto(`${url}/Administrador/admin.html`);
    await pagina.waitForFunction(() => document.getElementById('r_padreCelular').type === 'tel');
    const tiposAdmin = await pagina.evaluate(() => ['telefonoEstudiante','telefonoResponsable','whatsappResponsable','madreCelular','padreCelular'].map(clave => {
      const el = document.getElementById('r_' + clave);
      el.readOnly = false;
      el.value = '2348-9261';
      el.dispatchEvent(new Event('input'));
      return [clave,el.type,el.validationMessage];
    }));
    for (const [clave,tipo,error] of tiposAdmin) {
      assert.equal(tipo,'tel');
      assert.equal(Boolean(error), !['telefonoEstudiante','telefonoResponsable'].includes(clave), clave);
    }
    await pagina.evaluate(async () => {
      const {mostrarFichaOficial} = await import('/ficha-oficial.js');
      document.getElementById('resultadosBusqueda').style.display = 'block';
      mostrarFichaOficial(document.getElementById('contenidoImprimir'), {numeroFicha:'INCO-2027-ABCDEFGHIJK',primerNombre:'María',primerApellido:'Hernández',madreLugarTrabajo:'Calle Autopista Comalapa, km 13/2',especialidad:'Administrativo Contable (Segundos y Terceros)'});
      const {mostrarDisponibilidadDocumentos} = await import('/documentacion-disponible.js');
      const destino = document.querySelector('#modalExpediente .modal-expediente-body');
      const registro = {disponibilidadEstudiante:{documentos:[{texto:'Documento 1',disponible:true},{texto:'Documento 2',disponible:false}]}};
      mostrarDisponibilidadDocumentos(destino,registro);
      mostrarDisponibilidadDocumentos(destino,registro);
    });
    assert.equal(await pagina.locator('[data-disponibilidad-estudiante]').count(), 1, 'la consulta no duplica las declaraciones del estudiante');
    assert.match(await pagina.locator('[data-disponibilidad-estudiante]').textContent(), /✓ Disponible · Documento 1/);
    assert.match(await pagina.locator('[data-disponibilidad-estudiante]').textContent(), /Pendiente · Documento 2/);
    assert.ok(await pagina.locator('.ficha-oficial').evaluate(el => el.getBoundingClientRect().right <= innerWidth + 1), 'la ficha cabe en el panel administrador real');
    await pagina.goto(`${url}/Docente/docente.html`);
    await pagina.waitForFunction(() => document.getElementById('r_telefonoResponsable').type === 'tel');
    assert.deepEqual(await pagina.locator('#r_telefonoEstudiante,#r_telefonoResponsable').evaluateAll(campos => campos.map(el => {
      el.readOnly=false;
      el.value='9348-9261';el.dispatchEvent(new Event('input'));
      const invalido=el.getAttribute('aria-invalid') === 'true';
      el.value='5348-9261';el.dispatchEvent(new Event('input'));
      return [invalido,el.validationMessage === ''];
    })), [[true,true],[true,true]], 'edición docente valida prefijos y admite el 5');
    await pagina.close();
  } finally { await navegador?.close(); await new Promise(resolve => servidor.close(resolve)); }
});
