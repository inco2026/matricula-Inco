import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TELEFONOS_SV, errorTelefono, validarTelefonosDatos } from '../telefonos-sv.js';

test('todos los campos: ocho dígitos, fijos 2 y móviles 5/6/7 y excepción 8', () => {
  assert.equal(Object.keys(TELEFONOS_SV).length, 5);
  for (const [campo, regla] of Object.entries(TELEFONOS_SV)) {
    for (let prefijo = 0; prefijo <= 9; prefijo++) {
      const numero = `${prefijo}348-9261`;
      const permitido = (regla.celular ? [5,6,7,8] : [2,5,6,7,8]).includes(prefijo);
      assert.equal(errorTelefono(numero, regla.celular) === '', permitido, `${campo}: ${numero}`);
      if (permitido) {
        assert.doesNotThrow(() => validarTelefonosDatos({[campo]: numero}));
        assert.doesNotThrow(() => validarTelefonosDatos({[campo]: numero.replace('-', '')}));
      } else assert.throws(() => validarTelefonosDatos({[campo]: numero}), new RegExp(regla.etiqueta));
    }
    for (const numero of ['634-9821','63489-2167','abcd-9821','6348.9261','+50263489261','6348-9261extra','']) {
      if (!numero) continue; // La obligatoriedad se comprueba por separado en cada formulario.
      assert.throws(() => validarTelefonosDatos({[campo]: numero}), campo);
    }
    assert.doesNotThrow(() => validarTelefonosDatos({[campo]: ''}));
  }
});

test('altas y ediciones bloquean números inválidos antes de cualquier escritura', async () => {
  const escrituras = [];
  globalThis.__telefonosSupabase = {
    rpc: async (nombre, datos) => { escrituras.push({nombre,datos}); return {data:'id-prueba'}; },
    from(tabla) {
      const consulta = {
        update(datos) { escrituras.push({tabla,datos}); return consulta; },
        eq() { return consulta; },
        select() { return consulta; },
        single: async () => ({data:{id:'prueba'}})
      };
      return consulta;
    }
  };
  let fuente = await readFile(new URL('../supabase-data.js', import.meta.url), 'utf8');
  fuente = fuente.replace('import { supabase } from "./supabase-config.js";', 'const supabase = globalThis.__telefonosSupabase;')
    .replace("'./telefonos-sv.js'", JSON.stringify(new URL('../telefonos-sv.js', import.meta.url).href));
  const modulo = await import(`data:text/javascript;base64,${Buffer.from(fuente).toString('base64')}`);
  for (const campo of Object.keys(TELEFONOS_SV)) {
    await assert.rejects(modulo.crearMatricula({[campo]:'9348-9261'}));
    await assert.rejects(modulo.actualizarMatricula({id:'m',alumnoId:'a'}, {primerNombre:'María',[campo]:'9348-9261'}));
    assert.equal(escrituras.length, 0, `${campo}: sin escritura parcial`);
  }
  await modulo.crearMatricula({telefonoEstudiante:'2348-9261',telefonoResponsable:'5348-9261',whatsappResponsable:'6348-9261',madreCelular:'7348-9261',padreCelular:'53489261'});
  assert.equal(escrituras.length,1);
  assert.equal(escrituras[0].nombre,'crear_matricula');
  await modulo.actualizarMatricula({id:'m',alumnoId:'a'}, {telefonoEstudiante:'2348-9261',madreCelular:'5348-9261'});
  assert.equal(escrituras.length,3);
  delete globalThis.__telefonosSupabase;
});
