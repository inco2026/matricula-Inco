// SIGET, Plan de Numeración 2025:
// El prefijo 8 se admite como excepción solicitada por la institución.
// https://www.siget.gob.sv/wp-content/uploads/2025/09/PLAN-DE-NUMERACION-2025.pdf
export const TELEFONOS_SV = Object.freeze({
  telefonoEstudiante: { etiqueta: 'Teléfono del estudiante', celular: false },
  telefonoResponsable: { etiqueta: 'Teléfono del responsable', celular: false },
  whatsappResponsable: { etiqueta: 'WhatsApp del responsable', celular: true },
  madreCelular: { etiqueta: 'Celular de la madre', celular: true },
  padreCelular: { etiqueta: 'Celular del padre', celular: true }
});

export function errorTelefono(valor, celular = false) {
  if (!/^\d{4}-?\d{4}$/.test(valor)) return 'Ingrese 8 dígitos, con o sin guion (0000-0000).';
  const numero = valor.replace('-', '');
  if (!(celular ? /^[5678]/ : /^[25678]/).test(numero)) return celular
    ? 'El celular debe comenzar con 5, 6, 7 u 8.' : 'El teléfono debe comenzar con 2, 5, 6, 7 u 8.';
  if (/^(\d)\1{7}$/.test(numero) || /^(\d{2})\1{3}$/.test(numero) || /^(\d{4})\1$/.test(numero) || /(\d)\1{5,}/.test(numero) || '0123456789'.includes(numero) || '9876543210'.includes(numero)) {
    return 'El teléfono contiene una repetición o secuencia sospechosa. Revíselo.';
  }
  return '';
}

export function validarTelefonosDatos(datos) {
  for (const [clave, regla] of Object.entries(TELEFONOS_SV)) {
    if (!Object.prototype.hasOwnProperty.call(datos, clave)) continue;
    // La obligatoriedad depende del formulario; los campos opcionales pueden estar vacíos.
    const valor = String(datos[clave] ?? '').trim();
    if (!valor) continue;
    const error = errorTelefono(valor, regla.celular);
    if (error) throw new Error(`${regla.etiqueta}: ${error}`);
  }
}

export function configurarTelefonosEdicion(raiz) {
  for (const [clave, regla] of Object.entries(TELEFONOS_SV)) {
    const campo = raiz.querySelector(`#r_${clave}`);
    if (!campo) continue;
    campo.type = 'tel';
    campo.inputMode = 'numeric';
    campo.maxLength = 9;
    campo.pattern = regla.celular ? '[5678][0-9]{3}-?[0-9]{4}' : '[25678][0-9]{3}-?[0-9]{4}';
    campo.title = regla.celular
      ? 'Celular salvadoreño: 8 dígitos, comienza con 5, 6, 7 u 8.'
      : 'Teléfono salvadoreño: 8 dígitos, comienza con 2, 5, 6, 7 u 8.';
    campo.addEventListener('input', () => {
      const error = campo.value.trim() ? errorTelefono(campo.value.trim(), regla.celular) : '';
      campo.setCustomValidity(error);
      if (error) campo.setAttribute('aria-invalid', 'true');
      else campo.removeAttribute('aria-invalid');
    });
  }
}
