import { obtenerSupabase } from './api-publica.js';
import { descargarComprobantePDF } from './comprobante-pdf.js';

const form = document.getElementById('consulta');
const resultado = document.getElementById('resultado');
const datos = document.getElementById('datos');
const estado = document.getElementById('estado');
const buscar = document.getElementById('buscar');
let ficha = '';
let consultando = false;
function limpiar() { resultado.hidden = true; datos.replaceChildren(); ficha = ''; }
function iniciarConsultaVacia() {
  limpiar();
  form.reset();
  for (const campo of form.querySelectorAll('input')) campo.value = '';
  estado.textContent = '';
}
iniciarConsultaVacia();
// Incluye la restauración del navegador al volver con Atrás/Adelante.
window.addEventListener('pageshow', iniciarConsultaVacia);
try { document.body.classList.toggle('oscuro', localStorage.getItem('temaMatricula') === 'oscuro'); } catch {}
document.getElementById('tema').addEventListener('click', () => document.body.classList.toggle('oscuro'));
document.getElementById('nie').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0,12); });
document.getElementById('dui').addEventListener('input', e => {
  const digitos = e.target.value.replace(/\D/g, '').slice(0,9);
  e.target.value = digitos.length > 8 ? digitos.slice(0,8) + '-' + digitos.slice(8) : digitos;
});
form.addEventListener('input', () => { limpiar(); estado.textContent = ''; });
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (consultando || !form.reportValidity()) return;
  limpiar(); consultando = true; buscar.disabled = true; form.inert = true;
  estado.textContent = 'Verificando los datos…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const supabase = await obtenerSupabase();
    const { data, error } = await supabase.rpc('recuperar_comprobante', {
      p_nie: document.getElementById('nie').value,
      p_nacimiento: document.getElementById('nacimiento').value,
      p_dui: document.getElementById('dui').value
    }).abortSignal(controller.signal);
    if (error) throw error;
    if (data?.limitado) { estado.textContent = 'Se alcanzó el límite de consultas. Espere 15 minutos antes de intentar nuevamente.'; return; }
    if (!data?.numeroFicha) { estado.textContent = 'No se pudo recuperar el comprobante con esos datos. Revise la información o consulte con la institución.'; return; }
    const campos = [['Número de ficha','numeroFicha'],['NIE','nie'],['Estudiante','estudiante'],['Grado','grado'],['Especialidad','especialidad'],['Tipo de ingreso','tipoIngreso'],['Fecha de matrícula','fechaMatricula'],['Hora','horaMatricula'],['Responsable','responsable'],['Teléfono del responsable','telefonoResponsable'],['Correo del responsable','correoResponsable']];
    for (const [etiqueta, clave] of campos) {
      if (!data[clave]) continue;
      const fila = document.createElement('div');
      const dt = document.createElement('dt'); const dd = document.createElement('dd');
      dt.textContent = etiqueta; dd.textContent = data[clave]; fila.append(dt,dd); datos.append(fila);
    }
    ficha = String(data.numeroFicha).replace(/[^a-z0-9-]/gi,'');
    resultado.hidden = false;
    form.reset();
    estado.textContent = 'Comprobante recuperado. Puede descargarlo, imprimirlo o tomar una captura.';
    document.getElementById('comprobante').focus();
  } catch (error) {
    estado.textContent = error.code === 'PGRST202' ? 'La recuperación todavía no está habilitada. Contacte con la institución.' : 'No se pudo consultar el comprobante. Revise su conexión e inténtelo de nuevo.';
  } finally { clearTimeout(timeout); consultando = false; buscar.disabled = false; form.inert = false; }
});
document.getElementById('cerrar').addEventListener('click', () => { limpiar(); form.reset(); estado.textContent = ''; document.getElementById('nie').focus(); });
document.getElementById('imprimir').addEventListener('click', () => { if (!resultado.hidden) window.print(); });
document.getElementById('pdf').addEventListener('click', async e => {
  if (resultado.hidden) return;
  const comprobante = document.getElementById('comprobante');
  e.target.disabled = true;
  try {
    await descargarComprobantePDF(comprobante, `Comprobante-${ficha}.pdf`);
  } catch { estado.textContent = 'No se pudo descargar el PDF. Use Imprimir y seleccione Guardar como PDF.'; }
  finally { e.target.disabled = false; }
});
window.addEventListener('pagehide', () => { limpiar(); form.reset(); });
