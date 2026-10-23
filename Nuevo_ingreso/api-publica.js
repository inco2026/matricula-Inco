import { validarTelefonosDatos } from './telefonos-sv.js?v=2';

// Cargar la conexión solo cuando se consulta o guarda. Las validaciones locales
// y los botones siguen funcionando aunque no se pueda cargar el servicio remoto.
export async function obtenerSupabase() {
  const { supabase } = await import('./supabase-config.js');
  return supabase;
}

export async function nieYaExiste(valorNie) {
  const supabase = await obtenerSupabase();
  const { data, error } = await supabase.rpc('nie_ya_existe', { p_nie: valorNie });
  if (error) throw error;
  return Boolean(data);
}

export async function crearMatricula(datos) {
  validarTelefonosDatos(datos);
  const supabase = await obtenerSupabase();
  const funcion = datos.disponibilidadDocumentos ? 'crear_matricula_con_documentos' : 'crear_matricula';
  const { data, error } = await supabase.rpc(funcion, { p: datos });
  if (error) throw error;
  return { id: data };
}
