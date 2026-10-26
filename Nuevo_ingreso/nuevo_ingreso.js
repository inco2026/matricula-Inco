import { iniciarPaisNacimiento, nacimientoParaGuardar } from './pais-nacimiento.mjs';
import { iniciarBuscadorNacimiento, validarLugarNacimiento } from './buscador-nacimiento.js?v=4';
import { iniciarBorrador } from './borrador.mjs?v=5';
import { descargarComprobantePDF as descargarPDFCompleto } from './comprobante-pdf.js';
import { TELEFONOS_SV } from './telefonos-sv.js?v=2';
import { crearFichaAleatoria, fichaDelAnioSiguiente } from './ficha-aleatoria.mjs';
import { normalizarTexto, errorNombre, errorTelefono, errorCorreo, errorFecha, errorFoto, errorTextoDescriptivo } from './validaciones.mjs?v=7';
import {
  crearMatricula,
  nieYaExiste,
} from "./api-publica.js?v=2";

/* =========================================================
   REFERENCIAS
========================================================= */
const form = document.getElementById("matriculaForm");
iniciarBuscadorNacimiento();
iniciarPaisNacimiento();
const mensajeExito = document.getElementById("mensajeExito");

const numeroFicha = document.getElementById("numeroFicha");
const fechaMatricula = document.getElementById("fechaMatricula");
const horaMatricula = document.getElementById("horaMatricula");
const nie = document.getElementById("nie");
const tipoIngreso = document.getElementById("tipoIngreso");

const fechaNacimiento = document.getElementById("fechaNacimiento");
const edad = document.getElementById("edad");
const avisoSobreedad = document.getElementById("avisoSobreedad");

const grado = document.getElementById("grado");
const enfermedad = document.getElementById("enfermedad");
const conQuienVive = document.getElementById("conQuienVive");
const conQuienViveOtro = document.getElementById("conQuienViveOtro");
const campoConQuienViveOtro = document.getElementById("campoConQuienViveOtro");
const bloqueDatosMadre = document.getElementById("bloqueDatosMadre");
const bloqueDatosPadre = document.getElementById("bloqueDatosPadre");

const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");
const btnGuardar = document.getElementById("btnGuardar");

const pasos = document.querySelectorAll(".form-step");

const fotoInput = document.getElementById("fotoEstudiante");
const vistaPrevia = document.getElementById("vistaPreviaFoto");

let pasoActual = 1;
let guardando = false;
let guardado = false;
let controladorBorrador;
const TOTAL_PASOS = pasos.length;

function mostrarComprobanteMatricula(data) {
  const nombre = [data.primerNombre, data.segundoNombre, data.primerApellido, data.segundoApellido]
    .filter(Boolean)
    .join(" ");

  const campos = [
    ["Número de ficha", data.numeroFicha],
    ["NIE", data.nie],
    ["Estudiante", nombre],
    ["Grado", data.grado],
    ["Especialidad", data.especialidad],
    ["Tipo de ingreso", data.tipoIngreso],
    ["Fecha de matrícula", data.fechaMatricula],
    ["Hora", data.horaMatricula],
  ];

  // Datos del encargado/a: si el parentesco es Mamá o Papá, se muestra
  // además el nombre registrado en los datos de la madre/padre.
  const parentesco = data.parentesco || "";
  let etiquetaResponsable = "Responsable";
  if (parentesco === "Mamá") etiquetaResponsable = "Responsable (Madre)";
  else if (parentesco === "Papá") etiquetaResponsable = "Responsable (Padre)";
  else if (parentesco) etiquetaResponsable = `Responsable (${parentesco})`;

  campos.push([etiquetaResponsable, data.responsable]);
  if (data.telefonoResponsable) campos.push(["Teléfono del responsable", data.telefonoResponsable]);
  if (data.correoResponsable) campos.push(["Correo del responsable", data.correoResponsable]);

  const destino = document.getElementById("datosComprobante");
  if (destino) {
    destino.replaceChildren();
    campos.filter(([, valor]) => valor).forEach(([etiqueta, valor]) => {
      const fila = document.createElement('div');
      const titulo = document.createElement('dt');
      const contenido = document.createElement('dd');
      titulo.textContent = etiqueta;
      contenido.textContent = valor;
      fila.append(titulo, contenido);
      destino.appendChild(fila);
    });
  }
}

window.imprimirComprobanteMatricula = function () {
  window.print();
};

let descargandoComprobante = false;
window.descargarComprobantePDF = async function () {
  const elemento = document.getElementById("comprobanteImprimible");
  if (!elemento || descargandoComprobante) return;
  const boton = document.getElementById('btnDescargarComprobante');
  const fichaInput = document.getElementById("numeroFicha");
  const nombreArchivo = `Comprobante-Matricula-${(fichaInput && fichaInput.value) || "INCO"}.pdf`;
  descargandoComprobante = true;
  if (boton) boton.disabled = true;
  try {
    await descargarPDFCompleto(elemento, nombreArchivo);
  } catch {
    alert('No se pudo descargar el comprobante. Intente nuevamente o use Imprimir y Guardar como PDF.');
  } finally {
    descargandoComprobante = false;
    if (boton) boton.disabled = false;
  }
};

window.volverInicioMatricula = async function () {
  if (!guardado) return;
  await controladorBorrador?.eliminar();
  window.location.replace("./index.html");
};

/* =========================================================
   VALIDACIÓN POR CAMPO
========================================================= */
const mensajesPersonalizados = {
  nie: "El NIE debe contener solo números, entre 7 y 12 dígitos.",
  duiEstudiante: "Formato requerido: 00000000-0.",
  lugarNacimiento: "Ingrese el lugar de nacimiento del estudiante.",
  tipoTransporte: "Seleccione el tipo de transporte que utiliza.",
  zonaResidencia: "Seleccione la zona de residencia.",
  conQuienVive: "Seleccione con quién vive el estudiante.",
  conQuienViveOtro: "Especifique con quién vive el estudiante.",
  direccionResidencia: "Ingrese la dirección de residencia (máximo 70 caracteres, sin símbolos como * o +).",
  primerApellido: "Ingrese un apellido válido (máximo 12 caracteres).",
  segundoApellido: "Ingrese un apellido válido (máximo 12 caracteres).",
  primerNombre: "Ingrese un nombre válido (máximo 12 caracteres).",
  segundoNombre: "Ingrese un nombre válido (máximo 12 caracteres).",
  fechaNacimiento: "Seleccione la fecha de nacimiento del estudiante.",
  sexo: "Seleccione el sexo del estudiante.",
  telefonoEstudiante: "Use 8 dígitos; inicie con 2, 5, 6, 7 u 8.",
  correoEstudiantil: "Escriba solo números; el dominio @clases.edu.sv se agrega automáticamente.",
  correoPersonal: "Ingrese un correo válido de hasta 35 caracteres.",
  grado: "Seleccione el grado que cursará.",
  tipoIngreso: "Indique si el estudiante es de nuevo ingreso o antiguo ingreso.",
  especialidad: "Seleccione la especialidad o bachillerato.",
  ultimoAnioAprobado: "Seleccione el último año aprobado.",
  colegioAnterior: "Ingrese el nombre del centro educativo anterior.",
  hermanosCentroeducativo: "Indique si tiene hermanos en el centro educativo.",
  computadoraMineducyt: "Indique si posee computadora MINEDUCYT.",
  internet: "Indique si posee acceso a internet.",
  tallaZapatos: "Seleccione la talla de zapatos.",
  tallaCamisa: "Seleccione la talla de camisa.",
  tallaPantalon: "Seleccione la talla de pantalón.",
  tallaBlusa: "Seleccione la talla de blusa.",
  tallaFalda: "Seleccione la talla de falda.",
  vacunaCovid: "Indique si tiene la vacuna COVID-19.",
  enfermedad: "Indique si padece alguna enfermedad.",
  responsable: "Ingrese el nombre del responsable (solo letras).",
  parentesco: "Seleccione el parentesco del responsable.",
  duiResponsable: "Formato requerido: 00000000-0.",
  telefonoResponsable: "Use 8 dígitos; inicie con 2, 5, 6, 7 u 8.",
  whatsappResponsable: "Use 8 dígitos; inicie con 5, 6, 7 u 8.",
  correoResponsable: "Ingrese un correo electrónico válido (Gmail, Yahoo, Outlook u otro proveedor).",
  distanciaKm: "Ingrese la distancia en kilómetros (máximo 3 números, puede incluir un punto decimal).",
  madreNombre: "Ingrese el nombre completo de la madre (solo letras).",
  madreOcupacion: "Ingrese la ocupación de la madre.",
  madreLugarTrabajo: "Ingrese el lugar de trabajo de la madre.",
  madreDui: "Formato requerido: 00000000-0.",
  madreLugarNacimiento: "Ingrese el lugar de nacimiento de la madre.",
  madreFechaNacimiento: "Seleccione la fecha de nacimiento de la madre.",
  madreCelular: "Use 8 dígitos; inicie con 5, 6, 7 u 8.",
  padreNombre: "Ingrese el nombre completo del padre (solo letras).",
  padreOcupacion: "Ingrese la ocupación del padre.",
  padreLugarTrabajo: "Ingrese el lugar de trabajo del padre.",
  padreDui: "Formato requerido: 00000000-0.",
  padreLugarNacimiento: "Ingrese el lugar de nacimiento del padre.",
  padreFechaNacimiento: "Seleccione la fecha de nacimiento del padre.",
  padreCelular: "Use 8 dígitos; inicie con 5, 6, 7 u 8.",
  partidaNumero: "Ingrese el número de partida (solo números, máximo 5 dígitos).",
  folio: "Ingrese el folio (solo números).",
  tomo: "Ingrese el tomo (solo números).",
  libro: "Ingrese el libro (solo números)."
};

const MENSAJE_OBLIGATORIO = "Este campo es obligatorio.";

function obtenerContenedor(el) {
  return el.closest(".campo") || el.parentElement;
}

function obtenerSpanError(el) {
  const contenedor = obtenerContenedor(el);
  let span = contenedor.querySelector(".error-mensaje");
  if (!span) {
    span = document.createElement("span");
    span.className = "error-mensaje";
    contenedor.appendChild(span);
  }
  return span;
}

function campoVisible(el) {
  const contenedor = obtenerContenedor(el);
  if (!contenedor) return true;
  return contenedor.offsetParent !== null;
}

function limpiarError(el) {
  el.removeAttribute('aria-invalid');
  const contenedor = obtenerContenedor(el);
  if (!contenedor) return;
  contenedor.classList.remove("campo-invalido");
  const span = contenedor.querySelector(".error-mensaje");
  if (span) span.textContent = "";
  el.style.borderColor = "";
}

// Ignorar solamente el ocultamiento del paso; respetar campos condicionales ocultos.
function campoAplicable(el) {
  if (el.type === 'hidden' || el.disabled) return false;
  for (let nodo = el; nodo && nodo !== form; nodo = nodo.parentElement) {
    if (nodo.hidden) return false;
    if (!nodo.classList.contains('form-step') && getComputedStyle(nodo).display === 'none') return false;
  }
  return true;
}

function validarContenido(el, valor) {
  if (el.id === 'nacimientoExtranjero') return errorTextoDescriptivo(valor, { maximo: 100 });
  const duplicadoIdentidad = errorDuplicadoContacto(el, valor);
  if (duplicadoIdentidad) return duplicadoIdentidad;
  if (el.id === 'especialidad' && grado?.value === 'Tercer Año' && valor === 'Bachillerato General') return 'Bachillerato General no está disponible para Tercer Año.';
  if (el.id === 'correoResponsable' && valor.split('@')[0].length > 15) return 'Use máximo 15 caracteres antes de @; el dominio no cuenta.';
  if (['madreDui', 'padreDui'].includes(el.id)) {
    const otro = document.getElementById(el.id === 'madreDui' ? 'padreDui' : 'madreDui');
    if (valor.replace(/\D/g, '') === otro?.value.replace(/\D/g, '')) return 'El DUI del padre y de la madre no puede ser el mismo.';
  }
  if (el.maxLength > 0 && valor.length > el.maxLength) return `Máximo ${el.maxLength} caracteres.`;
  if (el.id === 'direccionResidencia') return errorTextoDescriptivo(valor, { direccion: true, maximo: 70 });
  if (['madreOcupacion', 'padreOcupacion', 'madreLugarTrabajo', 'padreLugarTrabajo', 'colegioAnterior'].includes(el.id)) return errorTextoDescriptivo(valor);
  if (['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido', 'responsable', 'madreNombre', 'padreNombre'].includes(el.id) || el.classList.contains('hermano-nombre')) return errorNombre(valor, el.maxLength > 0 ? el.maxLength : 50);
  if (TELEFONOS_SV[el.id]) return errorTelefono(valor, TELEFONOS_SV[el.id].celular);
  if (el.type === 'email') return errorCorreo(valor);
  if (el.type === 'date') return errorFecha(valor);
  if (el.tagName === 'SELECT' && !Array.from(el.options).some(o => !o.disabled && o.value === valor)) return 'Seleccione una opción válida de la lista.';
  if (el.id === 'nie' && (!/^\d{7,12}$/.test(valor) || /^0+$/.test(valor))) return 'Ingrese un NIE entre 7 y 12 dígitos, distinto de cero.';
  if (['duiEstudiante', 'duiResponsable', 'madreDui', 'padreDui'].includes(el.id) && /^(\d)\1{7}-\1$/.test(valor)) return 'Revise el DUI: no puede contener todos los dígitos iguales.';
  if (el.type === 'number' && (!Number.isFinite(Number(valor)) || el.validity.badInput || el.validity.rangeUnderflow || el.validity.rangeOverflow || el.validity.stepMismatch)) return 'Ingrese un número dentro del rango permitido.';
  if (['text', 'textarea'].includes(el.type) && (valor.length > 500 || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(valor))) return 'Use texto de hasta 500 caracteres sin etiquetas HTML ni caracteres de control.';
  return '';
}

function avisarError(mensaje) {
  if (mensajeExito) {
    mensajeExito.textContent = mensaje;
    mensajeExito.style.color = 'red';
    mensajeExito.setAttribute('role', 'alert');
  }
  alert(mensaje);
}

function validarCampo(el, incluirPasoOculto = false) {
  if (el.type === "submit" || el.type === "button" || el.type === 'hidden') return true;
  if (el.type === 'checkbox' || el.id === 'fotoCamara') return true;

  if (el.type === "file") {
    const fotoError = document.getElementById("fotoError");
    const mensajeFoto = el.dataset.camaraProcesando === 'true'
      ? 'Espere a que termine de preparar la foto.'
      : errorFoto(el.files[0]) || (el.dataset.estadoFoto !== 'lista' ? 'Espere a que termine de cargar una fotografía válida.' : '');
    if (mensajeFoto) {
      el.setAttribute('aria-invalid', 'true');
      if (fotoError) fotoError.textContent = mensajeFoto;
      el.closest(".foto-label")?.style.setProperty("border-color", "red");
      return false;
    } else {
      el.removeAttribute('aria-invalid');
      if (fotoError) fotoError.textContent = "";
      el.closest(".foto-label")?.style.removeProperty("border-color");
      return true;
    }
  }

  if (el.readOnly || el.disabled) return true;

  if (!(incluirPasoOculto ? campoAplicable(el) : campoVisible(el))) {
    limpiarError(el);
    return true;
  }

  let valido = true;
  let mensaje = "";
  const valor = el.value ? el.value.trim() : "";

  if (el.id === "lugarNacimiento") {
    mensaje = validarLugarNacimiento(el);
    valido = !mensaje;
  }

  if (el.hasAttribute("required") && !valor) {
    valido = false;
    mensaje = mensajesPersonalizados[el.id] || MENSAJE_OBLIGATORIO;
  } else if (valor && el.pattern) {
    const regex = new RegExp("^(?:" + el.pattern + ")$", 'u');
    if (!regex.test(valor)) {
      valido = false;
      mensaje = mensajesPersonalizados[el.id] || el.title || "El valor ingresado no es válido.";
    }
  }

  if (valido && (el.id === "correoPersonal" || el.id === "correoResponsable") && valor && !valor.includes("@")) {
    valido = false;
    mensaje = "El correo debe contener el símbolo arroba (@).";
  }

  if (valido && el.id === "nie" && el.dataset.duplicado === "true") {
    valido = false;
    mensaje = "Este NIE ya se encuentra registrado en el sistema.";
  }

  if (el.dataset.selectOrigen && !document.getElementById(el.dataset.selectOrigen)?.value) {
    valido = false; mensaje = 'Seleccione una opción de la lista de resultados.';
  }

  if (valido && valor) {
    mensaje = validarContenido(el, valor);
    valido = !mensaje;
  }

  const contenedor = obtenerContenedor(el);
  const span = obtenerSpanError(el);

  if (!valido) {
    el.setAttribute('aria-invalid', 'true');
    if (contenedor) contenedor.classList.add("campo-invalido");
    el.style.borderColor = "red";
    span.textContent = mensaje;
  } else {
    limpiarError(el);
  }
  return valido;
}

function camposPadre(prefijo) {
  return Array.from(document.querySelectorAll(`#bloqueDatos${prefijo === 'madre' ? 'Madre' : 'Padre'} input`));
}
function actualizarObligatoriosPadres() {
  const madre = camposPadre('madre'), padre = camposPadre('padre');
  const tieneMadre = madre.some(c => c.value.trim()), tienePadre = padre.some(c => c.value.trim());
  for (const [campos, activo] of [[madre,tieneMadre],[padre,tienePadre]]) {
    campos.forEach(c => { c.required = activo || (!tieneMadre && !tienePadre && c.id.endsWith('Nombre')); if (!c.required && !c.value) limpiarError(c); });
  }
}
function errorDuplicadoContacto(el, valor) {
  const duis = ['duiEstudiante','duiResponsable','madreDui','padreDui'];
  const ids = duis.includes(el.id) ? duis : Object.keys(TELEFONOS_SV).includes(el.id) ? Object.keys(TELEFONOS_SV) : [];
  const parentesco = document.getElementById('parentesco')?.value;
  const persona = id => {
    if (id.includes('Responsable')) return parentesco === 'Mamá' ? 'madre' : parentesco === 'Papá' ? 'padre' : 'responsable';
    return id.startsWith('madre') ? 'madre' : id.startsWith('padre') ? 'padre' : 'estudiante';
  };
  const numero = valor.replace(/\D/g,'');
  if (numero && ids.some(id => id !== el.id && persona(id) !== persona(el.id) && document.getElementById(id)?.value.replace(/\D/g,'') === numero)) return 'Este número ya está usado por otra persona en el formulario.';
  return '';
}
function validarPaso(numeroPaso, incluirPasoOculto = false) {
  actualizarObligatoriosPadres();
  const seccion = document.querySelector(`.form-step[data-step="${numeroPaso}"]`);
  if (!seccion) return true;

  if (numeroPaso === 2) {
    const gradoSeleccionado = document.getElementById("grado")?.value;
    const ultimoAnioAprobado = document.getElementById("ultimoAnioAprobado")?.value;

    if (gradoSeleccionado && ultimoAnioAprobado) {
      const anioEsperado = {
        "Primer Año": "Noveno Grado",
        "Segundo Año": "Primer Año",
        "Tercer Año": "Segundo Año"
      }[gradoSeleccionado];

      if (ultimoAnioAprobado !== anioEsperado && ultimoAnioAprobado !== gradoSeleccionado) {
        alert(`❌ Error de coherencia:\nSi el estudiante va a cursar "${gradoSeleccionado}", el último año aprobado debe ser "${anioEsperado}" (o el mismo año si está repitiendo).\n\nCorrija la información antes de continuar.`);
        return false;
      }
    }

  }

  const campos = seccion.querySelectorAll("input, select, textarea");
  let pasoValido = true;
  let primerInvalido = null;

  campos.forEach((el) => {
    if (el.type === "submit" || el.type === "button" || el.readOnly || el.disabled) return;
    if (el.classList && (el.classList.contains("hermano-input") || el.classList.contains("salud-input"))) return; // validado aparte
    const ok = validarCampo(el, incluirPasoOculto);
    if (!ok) {
      pasoValido = false;
      if (!primerInvalido) primerInvalido = el;
    }
  });

  if (numeroPaso === 2 && !validarHermanos()) {
    pasoValido = false;
  }

  if (numeroPaso === 4 && !validarSalud()) {
    pasoValido = false;
  }

  if (primerInvalido && !incluirPasoOculto) {
    primerInvalido.scrollIntoView({ behavior: "smooth", block: "center" });
    if (primerInvalido.type !== "file") {
      primerInvalido.focus({ preventScroll: true });
    }
  }

  return pasoValido;
}

function mensajeErroresPaso(numeroPaso) {
  return `Revise los campos marcados en el paso ${numeroPaso}.`;
}

// Enlazar validación en vivo
// Normalizar antes de los validadores y del autollenado del responsable.
function esCampoNombre(el) {
  return ['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido', 'responsable', 'madreNombre', 'padreNombre'].includes(el.id) || el.classList.contains('hermano-nombre');
}
function entradaNumericaInvalida(el, texto) {
  if (el.classList.contains('hermano-nie')) return /[^0-9]/u.test(texto);
  if (['nie', 'partidaNumero', 'folio', 'tomo', 'libro'].includes(el.id)) return /[^0-9]/u.test(texto);
  if (['duiEstudiante', 'duiResponsable', 'madreDui', 'padreDui'].includes(el.id)) return /[^0-9-]/u.test(texto);
  if (el.id === 'distanciaKm') return /[^0-9.]/u.test(texto);
  return false;
}
form.addEventListener('beforeinput', e => {
  if (e.data && entradaNumericaInvalida(e.target, e.data)) e.preventDefault();
  if (esCampoNombre(e.target) && e.data && /[^\p{L}\p{M} '’\-]/u.test(e.data)) e.preventDefault();
}, true);
form.addEventListener('paste', e => {
  if (entradaNumericaInvalida(e.target, e.clipboardData?.getData('text') || '')) e.preventDefault();
  if (esCampoNombre(e.target) && /[^\p{L}\p{M} '’\-]/u.test(e.clipboardData?.getData('text') || '')) e.preventDefault();
}, true);
function normalizarCampoEntrada(el) {
  if (esCampoNombre(el)) {
    const posicion = el.selectionStart;
    const anterior = el.value;
    const limpio = anterior.replace(/\p{N}/gu, '');
    if (anterior !== limpio) {
      el.value = limpio;
      if (posicion !== null) {
        const cursor = anterior.slice(0, posicion).replace(/\p{N}/gu, '').length;
        el.setSelectionRange(cursor, cursor);
      }
    }
  }
  if (['telefonoEstudiante', 'telefonoResponsable', 'whatsappResponsable', 'madreCelular', 'padreCelular'].includes(el.id)) formatearTelefonoEntrada(el);
  if (el.type === 'email') el.value = el.value.toLowerCase();
  if ((el.type === 'text' || el.tagName === 'TEXTAREA') && !el.readOnly && !esCampoNombre(el)) {
    const posicion = el.selectionStart;
    const anterior = el.value;
    const capitalizado = anterior.replace(/^(\s*)(\p{L})/u, (_, espacio, letra) => espacio + letra.toLocaleUpperCase('es'));
    if (anterior !== capitalizado) {
      el.value = capitalizado;
      if (posicion !== null) el.setSelectionRange(posicion, posicion);
    }
  }
  if (['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido', 'responsable', 'madreNombre', 'padreNombre'].includes(el.id) || el.classList.contains('hermano-nombre')) capitalizarEnVivo(el);
}
// Rechazar la edición completa evita transformar un correo pegado en otro distinto.
const correoResponsableLimitado = document.getElementById('correoResponsable');
// Conservar la edición del usuario y el cambio a dominios compuestos (.com.sv).
const correosAnteriores = new WeakMap();
form.addEventListener('focusin', e => {
  if (e.target.type === 'email') correosAnteriores.set(e.target, e.target.value);
});
form.addEventListener('input', e => {
  const campo = e.target;
  if (campo.type !== 'email' || campo.readOnly) return;
  const anterior = correosAnteriores.get(campo) || '';
  if (/@[^@]+\.com$/i.test(anterior) && campo.value.toLowerCase().startsWith(anterior.toLowerCase()) && /^[^.]/.test(campo.value.slice(anterior.length))) {
    campo.value = anterior;
  }
  correosAnteriores.set(campo, campo.value);
}, true);
let correoResponsableAnterior = correoResponsableLimitado?.value || '';
correoResponsableLimitado?.addEventListener('focus', () => {
  correoResponsableAnterior = correoResponsableLimitado.value;
});
form.addEventListener('input', e => {
  if (e.target !== correoResponsableLimitado) return;
  if (e.target.value.split('@')[0].length > 15) {
    e.target.value = correoResponsableAnterior;
  } else {
    correoResponsableAnterior = e.target.value;
  }
}, true);
['input', 'change', 'blur'].forEach(evento => form.addEventListener(evento, e => normalizarCampoEntrada(e.target), true));
function configurarSelect(select) {
  Array.from(select.options).forEach(opcion => {
    if (opcion.value === '') opcion.disabled = true;
  });
}
form.querySelectorAll('select').forEach(configurarSelect);
form.querySelectorAll('input[type="email"]').forEach(el => {
  el.setAttribute('autocapitalize', 'none');
  el.setAttribute('spellcheck', 'false');
});
const todosLosCampos = form.querySelectorAll("input, select, textarea");
['input','change'].forEach(evento => form.addEventListener(evento, e => {
  actualizarObligatoriosPadres();
  if (e.target.classList.contains('hermano-input')) validarHermanos();
  if (Object.keys(TELEFONOS_SV).includes(e.target.id) || /Dui|dui|parentesco/.test(e.target.id)) {
    for (const id of [...Object.keys(TELEFONOS_SV),'duiEstudiante','duiResponsable','madreDui','padreDui']) {
      const campo = document.getElementById(id);
      if (campo?.value) validarCampo(campo);
    }
  }
  if (!guardando && !guardado && mensajeExito) { mensajeExito.textContent = ''; mensajeExito.removeAttribute('role'); }
}));
todosLosCampos.forEach((el) => {
  if (el.type === "submit" || el.type === "button" || el.type === "file") return;
  el.addEventListener("input", () => validarCampo(el));
  el.addEventListener("change", () => validarCampo(el));
  el.addEventListener("blur", () => validarCampo(el));
});

/* =========================================================
   NIE DUPLICADO
========================================================= */
async function nieYaExisteEnBD(valorNie) {
  if (!valorNie) return false;
  try {
    return await nieYaExiste(valorNie);
  } catch (error) {
    throw new Error('No se pudo comprobar si el NIE ya está registrado. Revise su conexión e intente de nuevo.');
  }
}

async function verificarNieDuplicado() {
  if (!nie) return;
  const valor = nie.value.trim();
  nie.dataset.duplicado = "false";
  if (!valor) return;

  const span = obtenerSpanError(nie);
  const contenedor = obtenerContenedor(nie);
  if (span) span.textContent = "Verificando NIE…";
  if (contenedor) contenedor.classList.remove("campo-invalido");

  let existe;
  try {
    existe = await nieYaExisteEnBD(valor);
  } catch (error) {
    if (nie.value.trim() !== valor) return false;
    nie.dataset.duplicado = 'error';
    if (span) span.textContent = error.message;
    return false;
  }
  if (nie.value.trim() !== valor) return false;
  nie.dataset.duplicado = existe ? "true" : "false";
  validarCampo(nie);

  if (!existe && span && span.textContent === "Verificando NIE…") {
    span.textContent = "";
  }
  return !existe;
}

if (nie) {
  nie.addEventListener("blur", verificarNieDuplicado);
  nie.addEventListener("input", () => {
    nie.dataset.duplicado = "false";
  });
}

/* =========================================================
   FUNCIONES DE CONFIGURACIÓN
========================================================= */
function actualizarBloqueoEdad(bloqueado) {
  if (form) form.dataset.edadBloqueada = bloqueado ? "true" : "false";
  if (btnSiguiente && pasoActual === 1) btnSiguiente.disabled = bloqueado;
  if (btnGuardar) btnGuardar.disabled = bloqueado;
}

function actualizarEspecialidades() {
  const nuevo = tipoIngreso?.querySelector('option[value="Nuevo ingreso"]');
  if (nuevo) nuevo.disabled = false;
  const especialidad = document.getElementById('especialidad');
  const general = especialidad?.querySelector('option[value="Bachillerato General"]');
  if (!general) return;
  general.disabled = grado?.value === 'Tercer Año';
  if (general.disabled && especialidad.value === general.value) {
    especialidad.value = '';
    especialidad.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/* =========================================================
   SALUD: ¿padece alguna enfermedad? (bloque dinámico, máx. 3)
========================================================= */
const MAX_SALUD = 3;
let contadorSalud = 0;

const SUGERENCIAS_ENFERMEDADES = [
  "Asma", "Alergias", "Diabetes", "Hipertensión arterial", "Epilepsia", "Anemia",
  "Migraña", "Gastritis", "Dermatitis", "Rinitis alérgica", "Convulsiones",
  "Problemas de la vista", "Problemas auditivos", "Trastorno del habla", "TDAH",
  "Autismo", "Discapacidad motriz", "Cardiopatía", "Insuficiencia renal",
  "Tuberculosis", "Varicela", "Bronquitis", "Conjuntivitis", "Psoriasis",
  "Artritis", "Hipotiroidismo", "Hipertiroidismo", "Colesterol alto", "Obesidad",
  "Desnutrición", "Trastorno de ansiedad", "Depresión", "Sinusitis crónica",
  "Escoliosis", "Soplo cardíaco", "Intolerancia a la lactosa", "Celiaquía",
  "Vértigo", "Anemia falciforme", "Lupus"
];

function activarAutocompletado(input, sugerencias) {
  const lista = input.parentElement.querySelector(".autocompletado-lista");
  if (!lista) return;

  const render = (coincidencias) => {
    lista.innerHTML = "";
    if (!coincidencias.length) {
      lista.hidden = true;
      return;
    }
    coincidencias.slice(0, 6).forEach((texto) => {
      const li = document.createElement("li");
      li.textContent = texto;
      li.addEventListener("mousedown", (evento) => {
        evento.preventDefault();
        input.value = texto;
        lista.hidden = true;
        validarCampo(input);
      });
      lista.appendChild(li);
    });
    lista.hidden = false;
  };

  input.addEventListener("input", () => {
    const consulta = normalizarTexto(input.value).toLocaleLowerCase("es").trim();
    if (!consulta) {
      lista.hidden = true;
      return;
    }
    const coincidencias = sugerencias.filter((s) =>
      normalizarTexto(s).toLocaleLowerCase("es").includes(consulta)
    );
    render(coincidencias);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim()) input.dispatchEvent(new Event("input"));
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { lista.hidden = true; }, 150);
  });
}

function crearFilaSalud() {
  contadorSalud++;
  const idSufijo = contadorSalud;

  const fila = document.createElement("div");
  fila.className = "fila-salud";
  fila.dataset.indice = idSufijo;

  fila.innerHTML = `
    <div class="campo campo-autocompletar">
      <label for="enfermedad_${idSufijo}">¿Cuál enfermedad?</label>
      <input type="text" id="enfermedad_${idSufijo}" name="condicionEnfermedad[]"
             class="salud-input salud-enfermedad" maxlength="60" autocomplete="off"
             placeholder="Escriba o elija una sugerencia" />
      <ul class="autocompletado-lista" hidden></ul>
    </div>
    <div class="campo">
      <label for="medicamento_${idSufijo}">Medicamento (opcional)</label>
      <input type="text" id="medicamento_${idSufijo}" name="condicionMedicamento[]"
             class="salud-input salud-medicamento" maxlength="60"
             placeholder="Si no lo recuerda, puede dejarlo en blanco" />
    </div>
    <div class="campo">
      <label for="otrosSalud_${idSufijo}">Otros (opcional)</label>
      <input type="text" id="otrosSalud_${idSufijo}" name="condicionOtros[]"
             class="salud-input salud-otros" maxlength="100" placeholder="Observaciones" />
    </div>
    <button type="button" class="btn-hermano-quitar" title="Quitar esta condición" aria-label="Quitar esta condición">✕</button>
  `;

  const btnQuitar = fila.querySelector(".btn-hermano-quitar");
  btnQuitar.addEventListener("click", () => {
    fila.remove();
    actualizarEstadoBotonesSalud();
  });

  fila.querySelectorAll(".salud-input").forEach((inp) => {
    inp.addEventListener("input", () => limpiarError(inp));
    inp.addEventListener("change", () => limpiarError(inp));
  });

  activarAutocompletado(fila.querySelector(".salud-enfermedad"), SUGERENCIAS_ENFERMEDADES);

  return fila;
}

function actualizarEstadoBotonesSalud() {
  const lista = document.getElementById("listaSalud");
  const btnMas = document.getElementById("btnAgregarSalud");
  if (!lista || !btnMas) return;
  const total = lista.querySelectorAll(".fila-salud").length;
  btnMas.disabled = total >= MAX_SALUD;
  btnMas.title = total >= MAX_SALUD
    ? `Máximo ${MAX_SALUD} condiciones`
    : "Agregar otra condición de salud";
}

function validarSalud() {
  const enfermedadSelect = document.getElementById("enfermedad");
  if (!enfermedadSelect || enfermedadSelect.value !== "Sí") return true;

  const lista = document.getElementById("listaSalud");
  const avisoSalud = document.getElementById("avisoSaludVacio");
  if (!lista) return true;

  const filas = lista.querySelectorAll(".fila-salud");

  if (filas.length > MAX_SALUD) {
    if (avisoSalud) {
      avisoSalud.textContent = `Solo puede registrar hasta ${MAX_SALUD} condiciones.`;
      avisoSalud.style.display = "block";
    }
    return false;
  }

  if (filas.length === 0) {
    if (avisoSalud) {
      avisoSalud.textContent = "Agregue al menos una condición con el botón “+”.";
      avisoSalud.style.display = "block";
    }
    return false;
  }

  let valido = true;
  filas.forEach((fila) => {
    const enfermedadInput = fila.querySelector(".salud-enfermedad");
    const vacio = !enfermedadInput.value.trim();

    if (vacio) {
      valido = false;
      fila.classList.add("fila-salud-invalida");
      enfermedadInput.style.borderColor = "red";
    } else {
      fila.classList.remove("fila-salud-invalida");
      enfermedadInput.style.borderColor = "";
    }
  });

  if (avisoSalud) {
    avisoSalud.textContent = valido
      ? ""
      : "Especifique la enfermedad en cada condición agregada, o elimínela con “✕”.";
    avisoSalud.style.display = valido ? "none" : "block";
  }

  return valido;
}

function limpiarSalud() {
  const lista = document.getElementById("listaSalud");
  if (lista) lista.innerHTML = "";
  const avisoSalud = document.getElementById("avisoSaludVacio");
  if (avisoSalud) {
    avisoSalud.textContent = "";
    avisoSalud.style.display = "none";
  }
  actualizarEstadoBotonesSalud();
}

function configurarCamposSalud() {
  const enfermedadSelect = document.getElementById("enfermedad");
  const bloqueSalud = document.getElementById("bloqueSalud");
  const btnMas = document.getElementById("btnAgregarSalud");
  const lista = document.getElementById("listaSalud");

  if (!enfermedadSelect || !bloqueSalud || !btnMas || !lista) return;

  btnMas.addEventListener("click", () => {
    const total = lista.querySelectorAll(".fila-salud").length;
    if (total >= MAX_SALUD) return;
    lista.appendChild(crearFilaSalud());
    actualizarEstadoBotonesSalud();
  });

  enfermedadSelect.addEventListener("change", function () {
    if (this.value === "Sí") {
      bloqueSalud.style.display = "block";
      if (lista.querySelectorAll(".fila-salud").length === 0) {
        lista.appendChild(crearFilaSalud());
      }
      actualizarEstadoBotonesSalud();
    } else {
      bloqueSalud.style.display = "none";
      limpiarSalud();
    }
  });
}

function configurarFoto() {
  if (!fotoInput) return;
  fotoInput.required = true;
  const camara = document.getElementById('fotoCamara');
  document.getElementById('btnSubirFoto')?.addEventListener('click', () => fotoInput.click());
  document.getElementById('btnTomarFoto')?.addEventListener('click', () => camara?.click());
  camara?.addEventListener('change', async () => {
    const archivo = camara.files[0];
    if (!archivo) return;
    const boton = document.getElementById('btnTomarFoto');
    boton.disabled = true;
    fotoInput.dataset.camaraProcesando = 'true';
    let url;
    try {
      if (!['image/jpeg', 'image/png'].includes(archivo.type)) throw new Error('Use la cámara en formato JPG o PNG.');
      if (archivo.size > 25 * 1024 * 1024) throw new Error('La foto supera 25 MB. Reduzca la resolución de la cámara.');
      const imagen = new Image();
      url = URL.createObjectURL(archivo);
      imagen.src = url;
      await imagen.decode();
      const escala = Math.min(1, 1600 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
      lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
      const contexto = lienzo.getContext('2d');
      contexto.fillStyle = '#fff';
      contexto.fillRect(0, 0, lienzo.width, lienzo.height);
      contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      const blob = await new Promise(resolve => lienzo.toBlob(resolve, 'image/jpeg', .85));
      if (!blob) throw new Error('No se pudo preparar la foto. Intente nuevamente.');
      const transferencia = new DataTransfer();
      transferencia.items.add(new File([blob], 'foto-estudiante.jpg', { type: 'image/jpeg' }));
      fotoInput.files = transferencia.files;
      fotoInput.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (error) {
      document.getElementById('fotoError').textContent = error.message || 'No se pudo tomar la foto.';
    } finally {
      if (url) URL.revokeObjectURL(url);
      camara.value = '';
      boton.disabled = false;
      delete fotoInput.dataset.camaraProcesando;
    }
  });
  let version = 0;
  fotoInput.addEventListener('change', async function () {
    const actual = ++version;
    const archivo = this.files[0];
    const oculto = document.getElementById('fotoBase64');
    if (oculto) oculto.value = '';
    vistaPrevia?.replaceChildren();
    this.closest('.foto-label')?.classList.remove('con-foto');
    this.dataset.estadoFoto = 'cargando';
    form.dispatchEvent(new Event('fotoinvalidada'));
    const fallar = mensaje => {
      if (actual !== version) return;
      this.dataset.estadoFoto = 'error';
      const error = document.getElementById('fotoError');
      if (error) error.textContent = mensaje;
      form.dispatchEvent(new Event('fotoactualizada'));
    };
    const error = errorFoto(archivo);
    if (error) { fallar(error); return; }
    try {
      const bytes = new Uint8Array(await archivo.slice(0, 8).arrayBuffer());
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const png = [137,80,78,71,13,10,26,10].every((b, i) => bytes[i] === b);
      if (!(archivo.type === 'image/jpeg' ? jpg : png)) throw new Error('El archivo no es una imagen JPG o PNG válida.');
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('No se pudo leer la fotografía. Selecciónela nuevamente.'));
        reader.readAsDataURL(archivo);
      });
      const img = document.createElement('img');
      img.src = base64;
      await img.decode();
      if (!img.naturalWidth || img.naturalWidth * img.naturalHeight > 20000000) throw new Error('Use una fotografía de hasta 20 megapíxeles.');
      if (actual !== version) return;
      img.alt = 'Foto del estudiante';
      vistaPrevia?.appendChild(img);
      this.closest('.foto-label')?.classList.add('con-foto');
      let hiddenInput = document.getElementById('fotoBase64');
      if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'fotoBase64';
        hiddenInput.name = 'fotoBase64';
        form.appendChild(hiddenInput);
      }
      hiddenInput.value = base64;
      this.dataset.estadoFoto = 'lista';
      validarCampo(this);
      form.dispatchEvent(new Event('fotoactualizada'));
    } catch (error) {
      fallar(error.message || 'No se pudo abrir la fotografía.');
    }
  });
}

/* =========================================================
   HERMANOS EN EL CENTRO EDUCATIVO (dinámico, máx. 3)
========================================================= */
const MAX_HERMANOS = 3;
let contadorHermanos = 0;

function crearFilaHermano() {
  contadorHermanos++;
  const idSufijo = contadorHermanos;

  const fila = document.createElement("div");
  fila.className = "fila-hermano";
  fila.dataset.indice = idSufijo;

  fila.innerHTML = `
    <div class="campo hermano-campo-nombre">
      <label for="nombreHermano_${idSufijo}">Nombre del hermano/a</label>
      <input type="text" id="nombreHermano_${idSufijo}" name="nombresHermanos[]"
             class="hermano-input hermano-nombre" maxlength="50"
             pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+"
             placeholder="Nombre completo" />
    </div>
    <div class="campo hermano-campo-grado">
      <label for="gradoHermano_${idSufijo}">Grado actual</label>
      <select id="gradoHermano_${idSufijo}" name="gradosHermanos[]"
              class="hermano-input hermano-grado">
        <option value="" disabled selected>Seleccione el grado</option>
        <option value="Primer Año">Primer Año</option>
        <option value="Segundo Año">Segundo Año</option>
        <option value="Tercer Año">Tercer Año</option>
      </select>
    </div>
    <div class="campo hermano-campo-nie">
      <label for="nieHermano_${idSufijo}">NIE</label>
      <input id="nieHermano_${idSufijo}" name="niesHermanos[]" class="hermano-input hermano-nie" inputmode="numeric" maxlength="12" pattern="[0-9]{7,12}" placeholder="NIE del hermano/a" />
    </div>
    <button type="button" class="btn-hermano-quitar" title="Quitar este hermano" aria-label="Quitar este hermano">✕</button>
  `;

  const btnQuitar = fila.querySelector(".btn-hermano-quitar");
  btnQuitar.addEventListener("click", () => {
    fila.remove();
    actualizarEstadoBotonesHermanos();
  });

  fila.querySelectorAll(".hermano-input").forEach((inp) => {
    inp.addEventListener("input", () => limpiarError(inp));
    inp.addEventListener("change", () => limpiarError(inp));
  });
  const nombreHermano = fila.querySelector('.hermano-nombre');
  nombreHermano.pattern = "[\\p{L} '\u2019\\-]+";
  configurarSelect(fila.querySelector('select'));

  return fila;
}

function actualizarEstadoBotonesHermanos() {
  const lista = document.getElementById("listaHermanos");
  const btnMas = document.getElementById("btnAgregarHermano");
  if (!lista || !btnMas) return;
  const total = lista.querySelectorAll(".fila-hermano").length;
  btnMas.disabled = total >= MAX_HERMANOS;
  btnMas.title = total >= MAX_HERMANOS
    ? `Máximo ${MAX_HERMANOS} hermanos`
    : "Agregar otro hermano o hermana";
}

function validarHermanos() {
  const selectHermanos = document.getElementById("hermanosCentroeducativo");
  if (!selectHermanos || selectHermanos.value !== "Sí") return true;

  const lista = document.getElementById("listaHermanos");
  const avisoHermanos = document.getElementById("avisoHermanosVacio");
  if (!lista) return true;

  const filas = lista.querySelectorAll(".fila-hermano");

  if (filas.length > MAX_HERMANOS) {
    if (avisoHermanos) {
      avisoHermanos.textContent = `Solo puede registrar hasta ${MAX_HERMANOS} hermanos.`;
      avisoHermanos.style.display = 'block';
    }
    return false;
  }

  if (filas.length === 0) {
    if (avisoHermanos) {
      avisoHermanos.textContent = "Agregue al menos un hermano o hermana con el botón “+”.";
      avisoHermanos.style.display = "block";
    }
    return false;
  }

  let valido = true;
  filas.forEach((fila) => {
    const nombre = fila.querySelector(".hermano-nombre");
    const gradoH = fila.querySelector(".hermano-grado");
    const nieH = fila.querySelector('.hermano-nie');
    const nieInvalido = !/^[0-9]{7,12}$/.test(nieH.value) || /^0+$/.test(nieH.value) || nieH.value === nie.value || Array.from(filas).some(otra => otra !== fila && otra.querySelector('.hermano-nie').value === nieH.value);
    [nombre,gradoH,nieH].forEach(c => c.style.borderColor = '');
    const nombreVacio = !nombre.value.trim() || Boolean(errorNombre(nombre.value, 50));
    const gradoVacio = !gradoH.value.trim() || !Array.from(gradoH.options).some(o => o.value === gradoH.value && !o.disabled);
    const clave = normalizarTexto(nombre.value).toLocaleLowerCase('es');
    const duplicado = Array.from(filas).some(otra => otra !== fila && normalizarTexto(otra.querySelector('.hermano-nombre').value).toLocaleLowerCase('es') === clave);

    if (nombreVacio || gradoVacio || duplicado || nieInvalido) {
      if (nieInvalido) nieH.style.borderColor = 'red';
      valido = false;
      fila.classList.add("fila-hermano-invalida");
      if (nombreVacio || duplicado) { nombre.style.borderColor = "red"; }
      if (gradoVacio) { gradoH.style.borderColor = "red"; }
    } else {
      fila.classList.remove("fila-hermano-invalida");
      nombre.style.borderColor = "";
      gradoH.style.borderColor = "";
    }
  });

  if (avisoHermanos) {
    avisoHermanos.textContent = valido
      ? ""
      : "Revise nombre, grado y NIE (7 a 12 dígitos) de cada hermano. No repita nombres ni NIE, incluido el del estudiante.";
    avisoHermanos.style.display = valido ? "none" : "block";
  }

  return valido;
}

function limpiarHermanos() {
  const lista = document.getElementById("listaHermanos");
  if (lista) lista.innerHTML = "";
  const avisoHermanos = document.getElementById("avisoHermanosVacio");
  if (avisoHermanos) {
    avisoHermanos.textContent = "";
    avisoHermanos.style.display = "none";
  }
  actualizarEstadoBotonesHermanos();
}

function configurarCamposHermanos() {
  const selectHermanos = document.getElementById("hermanosCentroeducativo");
  const bloqueHermanos = document.getElementById("bloqueHermanos");
  const btnMas = document.getElementById("btnAgregarHermano");
  const lista = document.getElementById("listaHermanos");

  if (!selectHermanos || !bloqueHermanos || !btnMas || !lista) return;

  btnMas.addEventListener("click", () => {
    const total = lista.querySelectorAll(".fila-hermano").length;
    if (total >= MAX_HERMANOS) return;
    lista.appendChild(crearFilaHermano());
    actualizarEstadoBotonesHermanos();
  });

  selectHermanos.addEventListener("change", function() {
    if (this.value === "Sí") {
      bloqueHermanos.style.display = "block";
      if (lista.querySelectorAll(".fila-hermano").length === 0) {
        lista.appendChild(crearFilaHermano());
      }
      actualizarEstadoBotonesHermanos();
      actualizarObligatoriosPadres();
    } else {
      bloqueHermanos.style.display = "none";
      limpiarHermanos();
    }
  });
}

const TALLAS_VALIDAS = ["XS", "S", "M", "L", "XL"];

function configurarTallas() {
  const sexo = document.getElementById("sexo");
  const campoCamisa = document.getElementById("campoCamisa");
  const campoPantalon = document.getElementById("campoPantalon");
  const campoBlusa = document.getElementById("campoBlusa");
  const campoFalda = document.getElementById("campoFalda");
  const tallaCamisa = document.getElementById("tallaCamisa");
  const tallaPantalon = document.getElementById("tallaPantalon");
  const tallaBlusa = document.getElementById("tallaBlusa");
  const tallaFalda = document.getElementById("tallaFalda");

  if (!sexo) return;

  if (campoCamisa) campoCamisa.style.display = "none";
  if (campoPantalon) campoPantalon.style.display = "none";
  if (campoBlusa) campoBlusa.style.display = "none";
  if (campoFalda) campoFalda.style.display = "none";

  sexo.addEventListener("change", function() {
    if (this.value === "Masculino") {
      if (campoCamisa) campoCamisa.style.display = "block";
      if (campoPantalon) campoPantalon.style.display = "block";
      if (campoBlusa) campoBlusa.style.display = "none";
      if (campoFalda) campoFalda.style.display = "none";

      if (tallaCamisa) tallaCamisa.required = true;
      if (tallaPantalon) tallaPantalon.required = true;
      if (tallaBlusa) {
        tallaBlusa.required = false;
        tallaBlusa.value = "";
        limpiarError(tallaBlusa);
      }
      if (tallaFalda) {
        tallaFalda.required = false;
        tallaFalda.value = "";
        limpiarError(tallaFalda);
      }

    } else if (this.value === "Femenino") {
      if (campoCamisa) campoCamisa.style.display = "none";
      if (campoPantalon) campoPantalon.style.display = "none";
      if (campoBlusa) campoBlusa.style.display = "block";
      if (campoFalda) campoFalda.style.display = "block";

      if (tallaCamisa) {
        tallaCamisa.required = false;
        tallaCamisa.value = "";
        limpiarError(tallaCamisa);
      }
      if (tallaPantalon) {
        tallaPantalon.required = false;
        tallaPantalon.value = "";
        limpiarError(tallaPantalon);
      }
      if (tallaBlusa) tallaBlusa.required = true;
      if (tallaFalda) tallaFalda.required = true;

    } else {
      if (campoCamisa) campoCamisa.style.display = "none";
      if (campoPantalon) campoPantalon.style.display = "none";
      if (campoBlusa) campoBlusa.style.display = "none";
      if (campoFalda) campoFalda.style.display = "none";

      if (tallaCamisa) tallaCamisa.required = false;
      if (tallaPantalon) tallaPantalon.required = false;
      if (tallaBlusa) tallaBlusa.required = false;
      if (tallaFalda) tallaFalda.required = false;
    }
  });
}

function configurarUltimoAnioAprobado() {
  const ultimoAnio = document.getElementById("ultimoAnioAprobado");
  const ayuda = document.getElementById("ayudaUltimoAnio");
  if (!grado || !ultimoAnio) return;

  const mostrarAvisoRepeticion = () => {
    if (!ayuda) return;
    ayuda.classList.remove("advertencia-repeticion", "anio-correcto");

    if (!grado.value || !ultimoAnio.value) {
      ayuda.textContent = "";
      return;
    }

    const anioAnteriorEsperado = {
      "Primer Año": "Noveno Grado",
      "Segundo Año": "Primer Año",
      "Tercer Año": "Segundo Año"
    }[grado.value];

    if (ultimoAnio.value === anioAnteriorEsperado) {
      ayuda.textContent = `✓ Año anterior correcto: ${ultimoAnio.value}.`;
      ayuda.classList.add("anio-correcto");
    } else {
      ayuda.textContent = ultimoAnio.value === grado.value
        ? `⚠️ El estudiante está repitiendo ${grado.value}.`
        : `⚠️ Posible repetición: para cursar ${grado.value}, el año anterior esperado es ${anioAnteriorEsperado}.`;
      ayuda.classList.add("advertencia-repeticion");
    }
  };

  grado.addEventListener("change", mostrarAvisoRepeticion);
  ultimoAnio.addEventListener("change", mostrarAvisoRepeticion);
  mostrarAvisoRepeticion();
}

function configurarAutollenadoResponsable() {
  const parentesco = document.getElementById("parentesco");
  const responsable = document.getElementById("responsable");
  const duiResponsable = document.getElementById("duiResponsable");
  const telefonoResponsable = document.getElementById("telefonoResponsable");
  const whatsappResponsable = document.getElementById('whatsappResponsable');
  const correoResponsable = document.getElementById("correoResponsable");
  if (!parentesco || !responsable) return;

  const idsAutollenables = [
    "madreNombre", "madreDui", "madreCelular",
    "padreNombre", "padreDui", "padreCelular"
  ];

  idsAutollenables.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", (evento) => {
      delete evento.currentTarget.dataset.autollenadoResponsable;
    });
  });

  const sincronizar = () => {
    idsAutollenables.forEach((id) => {
      const campo = document.getElementById(id);
      if (campo?.dataset.autollenadoResponsable === "true") {
        campo.value = "";
        delete campo.dataset.autollenadoResponsable;
        limpiarError(campo);
      }
    });

    const prefijo = parentesco.value === "Mamá" ? "madre" : parentesco.value === "Papá" ? "padre" : "";
    if (!prefijo) return;
    const asignaciones = [
      [`${prefijo}Nombre`, responsable.value],
      [`${prefijo}Dui`, duiResponsable?.value || ""],
      [`${prefijo}Celular`, [telefonoResponsable?.value, whatsappResponsable?.value]
        .find(valor => valor && !errorTelefono(valor, true)) || '']
    ];
    asignaciones.forEach(([id, valor]) => {
      const campo = document.getElementById(id);
      if (campo) {
        campo.value = valor;
        campo.dataset.autollenadoResponsable = "true";
        validarCampo(campo);
      }
    });
  };

  [parentesco, responsable, duiResponsable, telefonoResponsable, whatsappResponsable, correoResponsable]
    .filter(Boolean)
    .forEach(campo => campo.addEventListener("input", sincronizar));
  parentesco.addEventListener("change", sincronizar);
}

/* =========================================================
   DISTANCIA EN KM: máximo 3 números (con un decimal opcional)
========================================================= */
function configurarDistanciaKm() {
  const campo = document.getElementById("distanciaKm");
  if (!campo) return;

  campo.addEventListener("input", function () {
    let valor = this.value.replace(/[^0-9.]/g, "");

    // Permitir un solo punto decimal
    const partes = valor.split(".");
    if (partes.length > 2) {
      valor = partes[0] + "." + partes.slice(1).join("");
    }

    const [entero, decimal] = valor.split(".");
    let enteroLimitado = (entero || "").slice(0, 3);
    let resultado = enteroLimitado;

    if (valor.includes(".")) {
      const decimalLimitado = (decimal || "").slice(0, Math.max(0, 3 - enteroLimitado.length));
      resultado = enteroLimitado + "." + decimalLimitado;
    }

    this.value = resultado;
  });
}

/* =========================================================
   DOCUMENTACIÓN A PRESENTAR (según grado y tipo de ingreso)
========================================================= */
const DOCUMENTACION = {
  "Nuevo ingreso": {
    "Primer Año": [
      "Certificado de 9° grado o boleta de nota con firma y sello (original y copia).",
      "Partida de nacimiento reciente (original y copia, máximo 3 meses de emisión).",
      "Constancia de conducta (original y copia).",
      "Cuatro fotografías de 3.5cm x 2.5cm (blanco y negro de tiempo en papel granulado). Podrán ser tomadas y recibidas en la institución.",
      "Hoja de inscripción con llenado completo y datos solicitados (letra legible y tinta azul).",
      "Dos fotocopias de DUI del responsable (y del estudiante si es mayor de edad) al 150%."
    ],
    "Segundo Año": [
      "Certificado de 9° grado y 1° año bachillerato (original y copia).",
      "Partida de nacimiento reciente (original y copia, máximo 3 meses de emisión).",
      "Constancia de conducta (original y copia).",
      "Constancia de servicios social estudiantil (original y copia).",
      "Cuatro fotografías de 3.5cm x 2.5cm (blanco y negro de tiempo en papel granulado). Podrán ser tomadas y recibidas en la institución.",
      "Hoja de inscripción con llenado completo y datos solicitados (letra legible y tinta azul).",
      "Dos fotocopias de DUI del responsable (y del estudiante si es mayor de edad) al 150%."
    ],
    "Tercer Año": [
      "Certificado de 9° grado, 1° y 2° año de bachillerato (original y copia).",
      "Partida de nacimiento reciente (original y copia, máximo 3 meses de emisión).",
      "Constancia de conducta (original y copia).",
      "Constancia de servicio social estudiantil (original y copia).",
      "Cuatro fotografías de 3.5cm x 2.5cm (blanco y negro de tiempo en papel granulado). Podrán ser tomadas y recibidas en la institución.",
      "Hoja de inscripción con llenado completo y datos solicitados (letra legible y tinta azul).",
      "Dos copias de DUI del responsable (y del estudiante si es mayor de edad) al 150%."
    ]
  },
  "Antiguo ingreso": {
    "Segundo Año": [
      "Cuatro fotografías de 3.5cm x 2.5cm (blanco y negro de tiempo en papel granulado). Podrán ser tomadas y recibidas en la institución.",
      "Boleta de notas SIGES de primer año de bachillerato con materias aprobadas (original y copia).",
      "Hoja de inscripción con llenado completo y datos solicitados (letra legible y tinta azul).",
      "Dos fotocopias de DUI del responsable (y del estudiante si es mayor de edad) al 150%."
    ],
    "Tercer Año": [
      "Cuatro fotografías de 3.5cm x 2.5cm (blanco y negro de tiempo en papel granulado). Podrán ser tomadas y recibidas en la institución.",
      "Boleta de notas SIGES de segundo año de bachillerato con materias aprobadas (original y copia).",
      "Hoja de inscripción con llenado completo y datos solicitados (letra legible y tinta azul).",
      "Dos fotocopias de DUI del responsable (y del estudiante si es mayor de edad) al 150%."
    ]
  }
};

// Primer año repetido conserva los documentos de primer año ya definidos.
// Se agrega al final para no cambiar los identificadores de borradores anteriores.
DOCUMENTACION['Antiguo ingreso']['Primer Año'] = [...DOCUMENTACION['Nuevo ingreso']['Primer Año']];

function actualizarDocumentacion() {
  const bloque = document.getElementById("bloqueDocumentacion");
  if (!bloque) return;
  const tipo = tipoIngreso ? tipoIngreso.value : "";
  const gradoValor = grado ? grado.value : "";
  // Conservar los controles de cada combinación permite recuperar el borrador
  // y volver a un grado anterior sin perder ni mezclar sus selecciones.
  if (!bloque.dataset.checksListos) {
    bloque.replaceChildren();
    const aviso = document.createElement('p');
    aviso.className = 'documentacion-placeholder';
    bloque.append(aviso);
    Object.entries(DOCUMENTACION).forEach(([ingreso, grados], t) => {
      Object.entries(grados).forEach(([anio, lista], g) => {
        const grupo = document.createElement('div');
        grupo.className = 'documentacion-grupo';
        grupo.dataset.tipo = ingreso;
        grupo.dataset.grado = anio;
        grupo.innerHTML = `<span class="documentacion-etiqueta">${ingreso} · ${anio}</span>
          <h4>Documentos a presentar</h4><p>Marque los que ya tiene disponibles.</p><ol class="documentacion-lista"></ol>
          <p class="documentacion-resumen" role="status" aria-live="polite"></p>`;
        lista.forEach((texto, i) => {
          const item = document.createElement('li');
          const etiqueta = document.createElement('label');
          const check = document.createElement('input');
          check.type = 'checkbox';
          check.id = `documento-${t}-${g}-${i}`;
          check.dataset.numero = String(i + 1);
          const contenido = document.createElement('span');
          contenido.textContent = `${i + 1}. ${texto}`;
          etiqueta.append(check, contenido);
          item.append(etiqueta);
          grupo.querySelector('ol').append(item);
        });
        bloque.append(grupo);
      });
    });
    bloque.addEventListener('change', actualizarResumenDocumentacion);
    bloque.dataset.checksListos = 'true';
  }
  let encontrado = false;
  bloque.querySelectorAll('.documentacion-grupo').forEach(grupo => {
    grupo.hidden = grupo.dataset.tipo !== tipo || grupo.dataset.grado !== gradoValor;
    if (!grupo.hidden) encontrado = true;
  });
  const aviso = bloque.querySelector('.documentacion-placeholder');
  aviso.hidden = encontrado;
  aviso.textContent = !tipo || !gradoValor
    ? 'Seleccione grado y tipo de ingreso para ver los documentos.'
    : 'Consulte la documentación requerida con la institución.';
  actualizarResumenDocumentacion();
}

function obtenerDisponibilidadDocumentos() {
  const grupo = document.querySelector('.documentacion-grupo:not([hidden])');
  if (!grupo) return null;
  const lista = DOCUMENTACION[grupo.dataset.tipo][grupo.dataset.grado];
  return {
    grado: grupo.dataset.grado,
    tipoIngreso: grupo.dataset.tipo,
    documentos: Array.from(grupo.querySelectorAll('input')).map((check, i) => ({
      numero: i + 1, texto: lista[i], disponible: check.checked
    }))
  };
}

function actualizarResumenDocumentacion() {
  const grupo = document.querySelector('.documentacion-grupo:not([hidden])');
  if (!grupo) return;
  const total = grupo.querySelectorAll('input').length;
  const disponibles = grupo.querySelectorAll('input:checked').length;
  grupo.querySelector('.documentacion-resumen').textContent = `${disponibles} de ${total} disponibles · ${total - disponibles} pendientes`;
}

/* =========================================================
   DUI DEL ESTUDIANTE: opcional si es menor, obligatorio a los 18
========================================================= */
function actualizarRequeridoDuiEstudiante() {
  const duiEstudiante = document.getElementById("duiEstudiante");
  if (!duiEstudiante || !edad) return;

  const edadActual = parseInt(edad.value);
  const esObligatorio = !Number.isNaN(edadActual) && edadActual >= 18;

  duiEstudiante.required = esObligatorio;

  const label = document.querySelector('label[for="duiEstudiante"]');
  if (label) {
    label.textContent = esObligatorio
      ? "DUI del estudiante"
      : "DUI del estudiante (opcional)";
  }

  if (!esObligatorio && !duiEstudiante.value.trim()) {
    limpiarError(duiEstudiante);
  } else {
    validarCampo(duiEstudiante);
  }
}

/* =========================================================
   INICIALIZACIÓN
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  configurarTallas();
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    colocarFechaHoraActual();
    setInterval(colocarFechaHoraActual, 1000);
    void generarNumeroFicha();
    mostrarPaso(1);
    configurarCamposSalud();
    grado?.addEventListener('change', actualizarEspecialidades);
    tipoIngreso?.addEventListener('change', actualizarEspecialidades);
    configurarFoto();
    configurarCorreoEstudiantil();
    configurarFechaNacimiento();
    configurarCamposHermanos();
    configurarTallas();
    configurarUltimoAnioAprobado();
    configurarAutollenadoResponsable();
    configurarConQuienVive();
    configurarTema();
    configurarDistanciaKm();
    actualizarRequeridoDuiEstudiante();

    if (btnSiguiente) {
      btnSiguiente.addEventListener("click", async () => {
        if (!validarPaso(pasoActual)) {
          avisarError(mensajeErroresPaso(pasoActual));
          return;
        }

        if (pasoActual === 1 && nie) {
          const verificado = await verificarNieDuplicado();
          if (!verificado) {
            avisarError(nie.dataset.duplicado === 'true' ? 'Este NIE ya está registrado.' : 'No se pudo verificar el NIE. Intente nuevamente.');
            validarCampo(nie);
            nie.scrollIntoView({ behavior: "smooth", block: "center" });
            nie.focus({ preventScroll: true });
            return;
          }
        }

        const secuencia = obtenerSecuenciaPasos();
        const posicion = secuencia.indexOf(pasoActual);
        if (posicion < secuencia.length - 1) {
          mostrarPaso(secuencia[posicion + 1]);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }

    if (btnAnterior) {
      btnAnterior.addEventListener("click", () => {
        const secuencia = obtenerSecuenciaPasos();
        const posicion = secuencia.indexOf(pasoActual);
        if (posicion > 0) {
          mostrarPaso(secuencia[posicion - 1]);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }

    if (grado) grado.addEventListener("change", validarSobreedad);
    if (tipoIngreso) tipoIngreso.addEventListener("change", validarSobreedad);

    if (grado) grado.addEventListener("change", actualizarDocumentacion);
    if (tipoIngreso) tipoIngreso.addEventListener("change", actualizarDocumentacion);
    actualizarDocumentacion();
    form.inert = true;
    try {
      controladorBorrador = await iniciarBorrador({ form, foto:fotoInput, crearHermano:crearFilaHermano, mostrarPaso, obtenerPaso:() => pasoActual, finalizado:() => guardado });
      document.dispatchEvent(new Event('restaurar-nacimiento'));
      actualizarObligatoriosPadres();
      actualizarEstadoBotonesHermanos();
      actualizarEstadoBotonesSalud();
      actualizarEspecialidades();
      actualizarResumenDocumentacion();
      todosLosCampos.forEach(el => { if (el.type !== 'file' && el.type !== 'hidden') limpiarError(el); });
    } finally { form.inert = false; }

  } catch (error) {
    console.error("Error al iniciar el formulario:", error);
  }
});

/* =========================================================
   ENVÍO DEL FORMULARIO
========================================================= */
if (form) {
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    if (guardando || guardado) return;
    guardando = true;
    if (btnGuardar) btnGuardar.disabled = true;
    form.setAttribute('aria-busy', 'true');
    try {
    calcularEdad();
    validarSobreedad();
    actualizarRequeridoDuiEstudiante();
    form.querySelectorAll('input, textarea').forEach(el => {
      if (campoAplicable(el) && ['text', 'textarea', 'email'].includes(el.type)) el.value = normalizarTexto(el.value);
      normalizarCampoEntrada(el);
    });

    const lugar = document.getElementById("lugarNacimiento");
    if (lugar && !lugar.disabled && validarLugarNacimiento(lugar)) {
      mostrarPaso(1);
      validarCampo(lugar);
      lugar.focus();
      return;
    }

    const mensajeBloqueo = document.getElementById("mensajeBloqueoEdad");
    if (mensajeBloqueo && mensajeBloqueo.classList.contains("mostrar")) {
      alert("❌ No se puede guardar la matrícula porque el estudiante supera la edad máxima permitida.");
      return;
    }

    let formularioValido = true;
    let primerPasoInvalido = null;

    for (const i of obtenerSecuenciaPasos()) {
      const ok = validarPaso(i, true);
      if (!ok) {
        formularioValido = false;
        if (!primerPasoInvalido) primerPasoInvalido = i;
      }
    }

    if (!formularioValido) {
      mostrarPaso(primerPasoInvalido);
      validarPaso(primerPasoInvalido);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (mensajeExito) {
        mensajeExito.textContent = "❌ Complete todos los campos obligatorios correctamente.";
        mensajeExito.style.color = "red";
      }
      avisarError(mensajeErroresPaso(primerPasoInvalido));
      return;
    }

    if (mensajeExito) {
      mensajeExito.textContent = "⏳ Verificando NIE…";
      mensajeExito.style.color = "blue";
    }
    form.inert = true;

    const valorNie = nie ? nie.value.trim() : "";
    const nieDuplicado = await nieYaExisteEnBD(valorNie);

    if (nieDuplicado) {
      nie.dataset.duplicado = "true";
      mostrarPaso(1);
      validarCampo(nie);
      nie.scrollIntoView({ behavior: "smooth", block: "center" });
      nie.focus({ preventScroll: true });
      if (mensajeExito) {
        mensajeExito.textContent = "❌ Este NIE ya está registrado. No se puede matricular dos veces con el mismo NIE.";
        mensajeExito.style.color = "red";
      }
      avisarError('Este NIE ya está registrado. No se guardó otra matrícula.');
      return;
    }

    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
      const campo = form.elements.namedItem(key);
      if (!['fotoBase64', 'fotoEstudiante', 'nombresHermanos[]', 'gradosHermanos[]', 'condicionEnfermedad[]', 'condicionMedicamento[]', 'condicionOtros[]'].includes(key) && typeof value === 'string' && campo && campoAplicable(campo) && value.trim() !== '') {
        data[key] = value.trim();
      }
    });

    data.lugarNacimiento = nacimientoParaGuardar();
    data.paisNacimiento = document.getElementById('paisNacimiento').selectedOptions[0].text;

    // Hermanos: se arman como lista de objetos { nombre, grado }
    const tieneHermanos = formData.get('hermanosCentroeducativo') === 'Sí';
    const nombresHermanos = tieneHermanos ? formData.getAll("nombresHermanos[]").map(v => normalizarTexto(v)) : [];
    const gradosHermanos = tieneHermanos ? formData.getAll("gradosHermanos[]").map(v => v.trim()) : [];
    const niesHermanos = tieneHermanos ? formData.getAll('niesHermanos[]').map(v => v.trim()) : [];
    const hermanos = nombresHermanos
      .map((nombreH, i) => ({ nombre: nombreH, grado: gradosHermanos[i] || "", nie: niesHermanos[i] || "" }))
      .filter(h => h.nombre || h.grado);
    if (hermanos.length) {
      data.hermanos = hermanos;
      // Compatibilidad con el campo de texto usado por las consultas existentes.
      data.nombresHermanos = hermanos.map(h => `${h.nombre} — ${h.grado} — NIE: ${h.nie}`).join('; ');
    }

    // Condiciones de salud: se arman como lista de objetos { enfermedad, medicamento, otros }
    const tieneSalud = formData.get('enfermedad') === 'Sí';
    const enfermedadesLista = tieneSalud ? formData.getAll("condicionEnfermedad[]").map(v => normalizarTexto(v)) : [];
    const medicamentosLista = tieneSalud ? formData.getAll("condicionMedicamento[]").map(v => v.trim()) : [];
    const otrosSaludLista = tieneSalud ? formData.getAll("condicionOtros[]").map(v => v.trim()) : [];
    const condicionesSalud = enfermedadesLista
      .map((enf, i) => ({ enfermedad: enf, medicamento: medicamentosLista[i] || "", otros: otrosSaludLista[i] || "" }))
      .filter(c => c.enfermedad || c.medicamento || c.otros);
    if (condicionesSalud.length) {
      data.condicionesSalud = condicionesSalud;
    }

    if (data.conQuienVive === "Otros" && data.conQuienViveOtro) {
      data.conQuienVive = `Otros: ${data.conQuienViveOtro}`;
    }

    const fotoBase64Input = document.getElementById("fotoBase64");
    if (fotoBase64Input && fotoBase64Input.value) {
      data.fotoEstudiante = fotoBase64Input.value;
    }

    data.fechaMatricula = fechaMatricula ? fechaMatricula.textContent : "";
    data.edad = edad.value;
    data.correoEstudiantil = `${valorNie}@clases.edu.sv`;
    data.estadoRevisionEdad = document.getElementById('estadoRevisionEdad')?.value || '';
    data.fechaCorteEdad = document.getElementById('fechaCorteEdad')?.value || '';
    data.horaMatricula = horaMatricula ? horaMatricula.textContent : "";
    data.numeroFicha = numeroFicha ? numeroFicha.value : "";
    data.estado = "Activo";
    data.fechaRegistro = new Date().toISOString();
    data.disponibilidadDocumentos = obtenerDisponibilidadDocumentos();

    try {
      if (!fichaDelAnioSiguiente(data.numeroFicha)) data.numeroFicha = crearFichaAleatoria();
      if (numeroFicha) numeroFicha.value = data.numeroFicha;
      if (mensajeExito) {
        mensajeExito.textContent = "⏳ Guardando matrícula...";
        mensajeExito.style.color = "blue";
      }

      // Solo reintentar una colisión de ficha confirmada por la restricción única.
      for (let intento = 0; ; intento++) {
        try { await crearMatricula(data); break; }
        catch (error) {
          const colisionFicha = error.code === '23505' && /matricula_ficha_unica|matriculas_numero_ficha_key/.test(`${error.message || ''} ${error.details || ''}`);
          if (!colisionFicha || intento >= 4) throw error;
          const anterior = data.numeroFicha;
          do { data.numeroFicha = crearFichaAleatoria(); } while (data.numeroFicha === anterior);
          if (numeroFicha) numeroFicha.value = data.numeroFicha;
        }
      }
      guardado = true;
      await controladorBorrador?.eliminar();

      form.querySelectorAll("input, select, textarea, button").forEach((campo) => {
        campo.disabled = true;
      });
      form.hidden = true;

      const panelFinal = document.getElementById("matriculaFinalizada");
      if (panelFinal) panelFinal.hidden = false;
      mostrarComprobanteMatricula(data);

      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
      avisarError(error.code === '23505' ? 'Ya existe un registro con este NIE, DUI o ficha. Revise los datos antes de reintentar.' : error.code === '23514' ? 'La base de datos rechazó datos inválidos. Revise nombres, teléfonos, correos y documentos.' : 'No se pudo confirmar el guardado. Revise la conexión y verifique el NIE antes de reintentar.');
    }
    } catch (error) {
      avisarError(error.message || 'No se pudo validar la matrícula. Intente nuevamente.');
    } finally {
      guardando = false;
      form.inert = false;
      form.removeAttribute('aria-busy');
      if (btnGuardar && !guardado) btnGuardar.disabled = form.dataset.edadBloqueada === 'true';
    }
  });
}

/* =========================================================
   FECHA Y HORA
========================================================= */
function colocarFechaHoraActual() {
  if (!fechaMatricula || !horaMatricula) return;

  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  fechaMatricula.textContent = `${dia}/${mes}/${anio}`;

  let horas = ahora.getHours();
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  const ampm = horas >= 12 ? "PM" : "AM";
  horas = horas % 12;
  horas = horas ? horas : 12;
  const horasFormateadas = String(horas).padStart(2, "0");

  horaMatricula.textContent = `${horasFormateadas}:${minutos} ${ampm}`;
}

/* =========================================================
   GENERAR NÚMERO DE FICHA
========================================================= */
function generarNumeroFicha() {
  if (!numeroFicha) return;

  numeroFicha.value = crearFichaAleatoria();
}

/* =========================================================
   CORREO ESTUDIANTIL
========================================================= */
function configurarCorreoEstudiantil() {
  const input = document.getElementById("correoEstudiantil");
  if (!input) return;

  input.readOnly = true;
  input.style.backgroundColor = "#f3f4f6";
  input.style.cursor = "not-allowed";

  const DOMINIO = "@clases.edu.sv";

  if (nie) {
    nie.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "");
      const soloNumeros = this.value;
      input.value = soloNumeros ? soloNumeros + DOMINIO : "";
      validarCampo(input);
    });
  }
}

/* =========================================================
   FECHA DE NACIMIENTO
========================================================= */
function configurarFechaNacimiento() {
  if (!fechaNacimiento) return;

  const hoy = new Date();
  const hoyLocal = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
  fechaNacimiento.setAttribute("max", hoyLocal);
  const fechaCorteEdad = document.getElementById("fechaCorteEdad");
  if (fechaCorteEdad) fechaCorteEdad.value = hoyLocal;

  fechaNacimiento.addEventListener("change", function() {
    calcularEdad();
    validarSobreedad();
    actualizarRequeridoDuiEstudiante();
  });

  fechaNacimiento.addEventListener("input", function() {
    calcularEdad();
    validarSobreedad();
    actualizarRequeridoDuiEstudiante();
  });
}

/* =========================================================
   CALCULAR EDAD
========================================================= */
function calcularEdad() {
  if (!fechaNacimiento || !edad) return;

  if (!fechaNacimiento.value) {
    edad.value = "";
    return;
  }

  const nacimiento = new Date(fechaNacimiento.value + "T00:00:00");
  const fechaCorte = new Date();

  let anios = fechaCorte.getFullYear() - nacimiento.getFullYear();
  const mes = fechaCorte.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && fechaCorte.getDate() < nacimiento.getDate())) {
    anios--;
  }

  edad.value = anios;
}

/* =========================================================
   VALIDAR SOBREEDAD
========================================================= */
function validarSobreedad() {
  if (!edad || !grado) return;

  const reglas = {
    "Primer Año": { minima: 14, maxima: 18 },
    "Segundo Año": { minima: 15, maxima: 20 },
    "Tercer Año": { minima: 17, maxima: 20 },
  };
  const mensaje = document.getElementById("mensajeBloqueoEdad");
  const estadoRevision = document.getElementById("estadoRevisionEdad");
  const edadActual = parseInt(edad.value);
  const regla = reglas[grado.value];

  mensaje.classList.remove("mostrar");
  mensaje.textContent = "";
  if (avisoSobreedad) {
    avisoSobreedad.classList.remove("mostrar", "valido", "revision");
    avisoSobreedad.textContent = "";
  }

  if (!regla || Number.isNaN(edadActual)) {
    if (estadoRevision) estadoRevision.value = "No evaluada";
    actualizarBloqueoEdad(false);
    return;
  }

  if (edadActual < regla.minima) {
    mensaje.innerHTML = `El estudiante tiene <b>${edadActual} años</b>. ` +
      `${grado.value} requiere una edad mínima de <b>${regla.minima} años</b>.`;
    mensaje.classList.add("mostrar");
    if (estadoRevision) estadoRevision.value = "No permitido por edad mínima";
    actualizarBloqueoEdad(true);
  } else if (edadActual > regla.maxima && grado.value === "Primer Año") {
    mensaje.innerHTML = `El estudiante tiene <b>${edadActual} años</b>. ` +
      `Primer Año permite una edad máxima de <b>${regla.maxima} años</b>.`;
    mensaje.classList.add("mostrar");
    if (estadoRevision) estadoRevision.value = "No permitido por edad máxima";
    actualizarBloqueoEdad(true);
  } else if (grado.value === "Primer Año" && edadActual === 18) {
    if (avisoSobreedad) {
      avisoSobreedad.innerHTML = `⚠️ Precaución: el estudiante tiene <b>18 años</b>. Puede continuar con la matrícula, pero el caso quedará <b>pendiente de revisión administrativa</b>.`;
      avisoSobreedad.classList.add("mostrar", "revision");
    }
    if (estadoRevision) estadoRevision.value = "Pendiente";
    actualizarBloqueoEdad(false);
  } else if (edadActual > regla.maxima) {
    if (avisoSobreedad) {
      avisoSobreedad.innerHTML = `El estudiante tiene <b>${edadActual} años</b> y ` +
        `supera el máximo regular de <b>${regla.maxima} años</b> para ${grado.value}. ` +
        `Puede continuar, pero la solicitud quedará <b>pendiente de revisión administrativa</b>.`;
      avisoSobreedad.classList.add("mostrar", "revision");
    }
    if (estadoRevision) estadoRevision.value = "Pendiente";
    actualizarBloqueoEdad(false);
  } else {
    if (avisoSobreedad) {
      avisoSobreedad.innerHTML = `Edad válida: <b>${edadActual} años</b>. ` +
        `El rango permitido para ${grado.value} es de ${regla.minima} a ${regla.maxima} años.`;
      avisoSobreedad.classList.add("mostrar", "valido");
    }
    if (estadoRevision) estadoRevision.value = "No requerida";
    actualizarBloqueoEdad(false);
  }

  actualizarRequeridoDuiEstudiante();
}

/* =========================================================
   MOSTRAR PASO
========================================================= */
function mostrarPaso(paso) {
  if (!pasos.length) return;

  pasos.forEach((section, index) => {
    const stepNum = index + 1;

    if (stepNum === paso) {
      section.classList.add("activo");
      section.style.display = "block";
    } else {
      section.classList.remove("activo");
      section.style.display = "none";
    }
  });

  if (btnAnterior) {
    btnAnterior.style.display = paso === 1 ? "none" : "inline-block";
  }

  const secuencia = obtenerSecuenciaPasos();
  const posicion = secuencia.indexOf(paso);
  const esUltimoPaso = posicion === secuencia.length - 1;

  if (btnSiguiente) btnSiguiente.style.display = esUltimoPaso ? "none" : "inline-block";

  if (btnGuardar) {
    btnGuardar.style.display = esUltimoPaso ? "inline-block" : "none";
  }

  pasoActual = paso;
  actualizarBarraProgreso(paso);
  form.dispatchEvent(new Event('cambiopaso'));

  if (paso === 6) {
    actualizarDocumentacion();
  }
}

function actualizarBarraProgreso(paso) {
  const texto = document.getElementById("progresoTexto");
  const porcentaje = document.getElementById("progresoPorcentaje");
  const relleno = document.getElementById("progresoRelleno");

  const secuencia = obtenerSecuenciaPasos();
  const pasoVisible = secuencia.indexOf(paso) + 1;
  const totalVisible = secuencia.length;
  if (!texto || !porcentaje || !relleno || !totalVisible) return;

  const pct = Math.round((pasoVisible / totalVisible) * 100);
  texto.textContent = `Paso ${pasoVisible} de ${totalVisible}`;
  porcentaje.textContent = `${pct}%`;
  relleno.style.width = `${pct}%`;
}

function obtenerSecuenciaPasos() {
  return [1, 2, 3, 4, 5, 6];
}

function configurarConQuienVive() {
  if (!conQuienVive) return;
  const actualizar = () => {
    const esOtro = conQuienVive.value === "Otros";
    if (campoConQuienViveOtro) campoConQuienViveOtro.hidden = !esOtro;
    if (conQuienViveOtro) {
      conQuienViveOtro.required = esOtro;
      conQuienViveOtro.disabled = !esOtro;
      if (!esOtro) {
        conQuienViveOtro.value = "";
        limpiarError(conQuienViveOtro);
      }
    }
    // Ambos bloques permanecen disponibles; basta completar uno de los padres.
    actualizarObligatoriosPadres();
    actualizarBarraProgreso(pasoActual);
  };
  conQuienVive.addEventListener("change", actualizar);
  actualizar();
}

function configurarTema() {
  const boton = document.getElementById("btnTema");
  if (!boton) return;
  const aplicar = (oscuro) => {
    document.body.classList.toggle("tema-oscuro", oscuro);
    boton.setAttribute("aria-pressed", String(oscuro));
    boton.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
    boton.querySelector(".icono-tema").textContent = oscuro ? "☀️" : "🌙";
    boton.querySelector(".texto-tema").textContent = oscuro ? "Tema claro" : "Tema oscuro";
  };
  try { aplicar(localStorage.getItem("temaMatricula") === "oscuro"); }
  catch { aplicar(false); }
  boton.addEventListener("click", () => {
    const oscuro = !document.body.classList.contains("tema-oscuro");
    aplicar(oscuro);
    try { localStorage.setItem("temaMatricula", oscuro ? "oscuro" : "claro"); }
    catch { /* El tema sigue funcionando aunque el navegador bloquee el almacenamiento. */ }
  });
}

/* ============================================================
   VALIDACIÓN Y FORMATO DE TELÉFONOS
============================================================ */
const camposTelefono = Object.keys(TELEFONOS_SV);

camposTelefono.forEach(id => {
  const campo = document.getElementById(id);
  if (!campo) return;

  campo.setAttribute('inputmode', 'numeric');
  const celular = TELEFONOS_SV[id].celular;
  campo.pattern = celular ? '[5678][0-9]{3}-?[0-9]{4}' : '[25678][0-9]{3}-?[0-9]{4}';
  campo.title = celular ? 'Celular salvadoreño: 8 dígitos, comienza con 5, 6, 7 u 8.' : 'Teléfono salvadoreño: 8 dígitos, comienza con 2, 5, 6, 7 u 8.';
  campo.addEventListener('beforeinput', e => {
    // Permitir números ya formateados desde autocompletado; el guion manual se agrega automáticamente.
    const permitido = e.data && (/^[0-9]+$/u.test(e.data) || (e.data.length > 1 && /^[0-9\s-]+$/u.test(e.data)));
    if (e.inputType.startsWith('insert') && e.data && !permitido) e.preventDefault();
  });
  campo.addEventListener('paste', e => {
    e.preventDefault();
    const texto = e.clipboardData?.getData('text') || '';
    if (/[^0-9\s-]/u.test(texto)) return;
    campo.setRangeText(texto.replace(/\D/g, ''), campo.selectionStart, campo.selectionEnd, 'end');
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  });
  campo.addEventListener("input", function () {
    validarCampo(this);
  });
});

function formatearTelefonoEntrada(campo) {
  // No convertir un texto como «tel61234589» en un teléfono válido.
  // El autocompletado y las asignaciones externas también deben validarse.
  if (/[^0-9\s-]/u.test(campo.value)) return;
  const cursor = campo.selectionStart;
  const digitosAntes = campo.value.slice(0, cursor ?? campo.value.length).replace(/\D/g, '').length;
  // Conservar dígitos extra para señalar el error; truncarlos podría guardar otro número.
  const numeros = campo.value.replace(/\D/g, '');
  const valor = numeros.length > 4 ? numeros.slice(0, 4) + '-' + numeros.slice(4) : numeros;
  if (campo.value !== valor) {
    campo.value = valor;
    if (cursor !== null) {
      const posicion = Math.min(valor.length, digitosAntes + (digitosAntes > 4 ? 1 : 0));
      campo.setSelectionRange(posicion, posicion);
    }
  }
}

/* ============================================================
   VALIDACIÓN Y FORMATO DE DUI
============================================================ */
const camposDui = [
  "duiEstudiante",
  "duiResponsable",
  "madreDui",
  "padreDui"
];

camposDui.forEach(id => {
  const campo = document.getElementById(id);
  if (!campo) return;

  campo.addEventListener("input", function () {
    let numeros = this.value.replace(/\D/g, "");
    numeros = numeros.substring(0, 9);
    if (numeros.length > 8) {
      numeros = numeros.substring(0, 8) + "-" + numeros.substring(8);
    }
    this.value = numeros;
    if (['madreDui', 'padreDui'].includes(id)) {
      validarCampo(this);
      const otro = document.getElementById(id === 'madreDui' ? 'padreDui' : 'madreDui');
      if (otro?.value) validarCampo(otro);
    }
  });
});

/* ============================================================
   CAMPOS DE SOLO LETRAS
============================================================ */
const camposLetraCortos = [
  "primerApellido",
  "segundoApellido",
  "primerNombre",
  "segundoNombre"
];

const camposLetraLargos = [
  "responsable",
  "madreNombre",
  "padreNombre"
];

const camposSoloLetras = ["parentesco"];

function capitalizarTexto(texto) {
  return texto
    .toLowerCase()
    .split(" ")
    .map(palabra => (palabra.length ? palabra.charAt(0).toUpperCase() + palabra.slice(1) : palabra))
    .join(" ");
}

function capitalizarEnVivo(input) {
  const posicionCursor = input.selectionStart;
  const valorOriginal = input.value;
  const valorCapitalizado = capitalizarTexto(valorOriginal);

  if (valorOriginal !== valorCapitalizado) {
    input.value = valorCapitalizado;
    input.setSelectionRange(posicionCursor, posicionCursor);
  }
}

function configurarCampoSoloLetras(id, maxLongitud) {
  const campo = document.getElementById(id);
  if (!campo) return;

  if (maxLongitud) campo.setAttribute("maxlength", String(maxLongitud));
  campo.pattern = "[\\p{L} '\u2019\\-]+";

  campo.addEventListener("input", function () {
    capitalizarEnVivo(this);
    validarCampo(this);
  });

  campo.addEventListener("blur", function () {
    if (this.value.trim()) {
      this.value = capitalizarTexto(this.value.trim());
    }
    validarCampo(this);
  });
}

camposLetraCortos.forEach(id => configurarCampoSoloLetras(id, 12));
camposLetraLargos.forEach(id => configurarCampoSoloLetras(id, 50));
camposSoloLetras.forEach(id => configurarCampoSoloLetras(id, null));

/* ============================================================
   CAMPOS DE SOLO NÚMEROS (partida de nacimiento)
============================================================ */
const camposNumeroSimple = [
  "partidaNumero",
  "folio",
  "tomo",
  "libro"
];

camposNumeroSimple.forEach(id => {
  const campo = document.getElementById(id);
  if (!campo) return;

  campo.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
  });
});
