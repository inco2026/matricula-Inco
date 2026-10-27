const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');
const { chromium } = createRequire('C:/Users/consu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');

test('Ingreso y panel reales: abrir, cerrar, acceder y crear los tres roles sin CDN', async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const nombre = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + nombre);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.statusCode = 404; return res.end();
    }
    res.setHeader('Content-Type', nombre.endsWith('.html') ? 'text/html; charset=utf-8' : nombre.endsWith('.css') ? 'text/css' : /\.m?js$/.test(nombre) ? 'text/javascript; charset=utf-8' : 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const page = await browser.newPage();
    const errores = [], usuarios = [];
    let administradorActivo = true;
    let falloEstado = false;
    page.on('pageerror', e => errores.push(e.message));
    const id = '00000000-0000-4000-8000-000000000001';
    const user = { id, aud: 'authenticated', role: 'authenticated', email: 'admin@example.com', app_metadata: {}, user_metadata: {} };
    const token = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: id, role: 'authenticated', exp: Math.floor(Date.now()/1000) + 3600 })).toString('base64url'), 'firma-de-prueba'].join('.');
    await page.route('https://**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      // La prueba bloquea todos los CDN y usa los módulos locales verdaderos.
      if (!url.hostname.endsWith('.supabase.co')) return route.abort();
      const json = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      if (url.pathname === '/auth/v1/token') {
        if (request.postDataJSON().password !== 'Correcta123') return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }) });
        return json({ access_token: token, refresh_token: 'refresh-de-prueba', expires_in: 3600, token_type: 'bearer', user });
      }
      if (url.pathname === '/auth/v1/user') return json(user);
      if (url.pathname === '/rest/v1/perfiles') return json(url.searchParams.has('id') ? { id, nombre: 'Administración', correo: user.email, rol: 'administrador', activo: administradorActivo } : usuarios);
      if (url.pathname === '/rest/v1/rpc/cambiar_estado_usuario') {
        if (falloEstado) return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({code:'PGRST202',message:'Missing function'})});
        const datos = request.postDataJSON();
        const usuario = usuarios.find(u => u.id === datos.p_id);
        usuario.activo = datos.p_activo;
        return json({ id: usuario.id, activo: usuario.activo });
      }
      if (url.pathname === '/functions/v1/crear-usuario') {
        const datos = request.postDataJSON();
        if (datos.accion === 'ingresar') {
          if (!administradorActivo || datos.nombre !== 'Administración' || datos.contrasena !== 'Correcta123') return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'Nombre o contraseña incorrectos.'})});
          return json({ok:true,session:{access_token:token,refresh_token:'refresh-de-prueba'}});
        }
        const usuario = { id: 'nuevo-' + usuarios.length, nombre: datos.nombre, correo: datos.correo, rol: datos.rol };
        usuarios.push(usuario); return json({ ok: true, usuario });
      }
      if (url.pathname === '/rest/v1/matriculas') return json([]);
      return json({});
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/administrador.html`);
    await page.locator('#btnAdministrador').click();
    await page.waitForFunction(() => !document.getElementById('modalAdministrador').classList.contains('oculto'));
    await page.locator('[data-cerrar="modalAdministrador"]').click();
    await page.waitForFunction(() => document.getElementById('modalAdministrador').classList.contains('oculto'));
    await page.locator('#btnAdministrador').click();
    await page.locator('#usuarioAdmin').fill('Administración');
    await page.locator('#passwordAdmin').fill('Incorrecta123');
    await page.locator('#formAdministrador button[type=submit]').click();
    await page.waitForFunction(() => document.getElementById('mensajeAdmin').textContent.includes('incorrectos'));
    assert.equal(await page.locator('#formAdministrador button[type=submit]').isEnabled(), true);
    await page.locator('#passwordAdmin').fill('Correcta123');
    await page.locator('#formAdministrador button[type=submit]').click();
    await page.waitForURL('**/Administrador/admin.html');
    await page.waitForFunction(() => typeof window.mostrarDocentes === 'function');
    await page.locator('button[onclick="mostrarDocentes()"], a[onclick="mostrarDocentes()"]').click();
    for (const rol of ['docente', 'coordinador', 'administrador']) {
      await page.locator('[onclick="abrirNuevoUsuario()"]').click();
      await page.locator('#nuevoUsuarioNombre').fill('Prueba de ' + rol);
      await page.locator('#nuevoUsuarioCorreo').fill(rol + '@example.com');
      await page.locator('#nuevoUsuarioContrasena').fill('CuentaNueva123');
      await page.locator('#nuevoUsuarioRol').selectOption(rol);
      await page.locator('#btnCrearDocente').click();
      await page.waitForFunction(() => document.getElementById('mensajeNuevoUsuario').textContent.includes('Usuario creado correctamente'));
      await page.waitForFunction(() => !document.getElementById('modalNuevoUsuario').classList.contains('activo'));
    }
    assert.deepEqual(usuarios.map(u => u.rol), ['docente', 'coordinador', 'administrador']);
    await page.waitForFunction(() => document.querySelectorAll('#cuerpoTablaDocentes tr').length === 3);
    assert.equal(await page.locator('#cuerpoTablaDocentes tr').count(), 3);
    const primeraFila = page.locator('#cuerpoTablaDocentes tr').first();
    page.on('dialog', dialog => dialog.dismiss()); // El cambio de estado no debe depender de diálogos nativos.
    await primeraFila.getByRole('button', { name: 'Inhabilitar', exact: true }).click();
    await primeraFila.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal(usuarios[0].activo, undefined);
    falloEstado = true;
    await primeraFila.getByRole('button', { name: 'Inhabilitar', exact: true }).click();
    await primeraFila.getByRole('button', { name: 'Confirmar inhabilitación', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#cuerpoTablaDocentes tr [role="status"]').textContent.includes('Falta activar'));
    assert.equal(usuarios[0].activo, undefined);
    assert.equal(await primeraFila.getByRole('button', { name: 'Inhabilitar', exact: true }).isEnabled(), true);
    falloEstado = false;
    await primeraFila.getByRole('button', { name: 'Inhabilitar', exact: true }).click();
    await primeraFila.getByRole('button', { name: 'Confirmar inhabilitación', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('mensajeDocentes').textContent.includes('inhabilitado correctamente'));
    assert.equal(usuarios[0].activo, false);
    await primeraFila.getByRole('button', { name: 'Habilitar', exact: true }).click();
    await primeraFila.getByRole('button', { name: 'Confirmar habilitación', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('mensajeDocentes').textContent === 'Usuario habilitado correctamente.');
    assert.equal(usuarios[0].activo, true);
    assert.equal(await page.locator('#cuerpoTablaDocentes tr').last().getByRole('button', { name: 'Inhabilitar', exact: true }).isDisabled(), true);
    await page.locator('[onclick="mostrarReportes()" ]').click();
    await page.locator('[onclick="buscarReportes()" ]').click();
    await page.waitForFunction(() => document.getElementById('mensajeReportes').textContent.includes('No se encontraron'));
    await page.locator('[onclick="limpiarReportes()" ]').click();
    administradorActivo = false;
    await page.goto(`http://127.0.0.1:${server.address().port}/administrador.html`);
    await page.locator('#btnAdministrador').click();
    await page.locator('#usuarioAdmin').fill('Administración');
    await page.locator('#passwordAdmin').fill('Correcta123');
    await page.locator('#formAdministrador button[type=submit]').click();
    await page.waitForFunction(() => document.getElementById('mensajeAdmin').textContent.includes('Nombre o contraseña incorrectos'));
    assert.deepEqual(errores, []);
  } finally {
    if (browser) await browser.close();
    await new Promise(r => server.close(r));
  }
});
