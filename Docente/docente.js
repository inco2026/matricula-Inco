import { DOCUMENTOS_INSCRIPCION, DOCUMENTOS_ANTERIORES, claveDocumento } from '../documentos-inscripcion.js';
import { activarEdicion, desactivarEdicion, validarMatricula, leerFotoAdministrador } from '../Administrador/reglas-formulario.js';
import { protegerRuta } from "../auth-guard.js";
import {
  etiquetaCampo,
  marcarErrorCampo,
  nieBusquedaValido,
  restringirBuscadorNie,
} from "../validacion-matricula.js";
import {
  actualizarMatricula,
  listarMatriculas,
  buscarMatriculaPorNie,
  guardarDocumentos as guardarDocumentosSupabase,
} from "../supabase-data.js";

const accesoDocente = await protegerRuta("docente");

if (accesoDocente) {
  const identificador = document.getElementById("identificadorDocente");
  const nombre = sessionStorage.getItem("nombreUsuario") || "Docente";
  if (identificador) identificador.textContent = `Docente responsable: ${nombre}`;
}

/* =========================================================
   INDICACIONES / DOCUMENTOS REQUERIDOS POR AÑO
   (Si se edita aquí, editar igual en Administrador/admin.js)
   NOTA: el punto 1 de "tercer_antiguo" se completó siguiendo el
   patrón de "segundo_antiguo"; verifique contra el volante físico.
========================================================= */
const INDICACIONES = DOCUMENTOS_INSCRIPCION;

const INDICACIONES_GENERALES = [
  "El o la estudiante debe venir acompañado de su padre, madre o responsable",
  "Las fotografías deben venir con el nombre completo del estudiante escrito",
  "Niñas: no lucir peinados extravagantes, maquillaje, cabello pintado ni aretes",
  "Niños: corte de cabello formal (clara/francesa) y sin barba",
];

/* =========================================================
   REFERENCIAS
========================================================= */
const mensajeBusqueda = document.getElementById("mensajeBusqueda");
const resultadosSection = document.getElementById("resultadosBusqueda");
const buscarInput = document.getElementById("buscarInput");
const seccionDocumentos = document.getElementById("seccionDocumentos");
const tipoIndicacionesSelect = document.getElementById("tipoIndicacionesSelect");
const listaPrincipal = document.getElementById("listaPrincipal");
const listaGeneral = document.getElementById("listaGeneral");
const observacionesDocumentos = document.getElementById("observacionesDocumentos");
const mensajeDocumentos = document.getElementById("mensajeDocumentos");

let matriculaActual = null;
let guardandoCambios = false;

/* Todos los campos de la ficha (mismo listado que el administrador + tipoIngreso) */
const CAMPOS_FICHA = [
  "numeroFicha", "fechaMatricula", "nie", "duiEstudiante", "lugarNacimiento",
  "tipoTransporte", "distanciaKm", "zonaResidencia", "conQuienVive", "direccionResidencia",
  "primerApellido", "segundoApellido", "primerNombre", "segundoNombre",
  "fechaNacimiento", "edad", "sexo", "telefonoEstudiante", "correoEstudiantil", "correoPersonal",
  "grado", "tipoIngreso", "especialidad", "ultimoAnioAprobado", "colegioAnterior",
  "hermanosCentroeducativo", "nombresHermanos", "nivelAcademico",
  "computadoraMineducyt", "internet",
  "tallaCamisa", "tallaPantalon", "tallaBlusa", "tallaFalda", "tallaZapatos",
  "enfermedad", "cualEnfermedad", "medicamento", "otros",
  "responsable", "parentesco", "duiResponsable", "telefonoResponsable",
  "whatsappResponsable", "correoResponsable",
  "madreNombre", "madreOcupacion", "madreLugarTrabajo", "madreDui",
  "madreLugarNacimiento", "madreFechaNacimiento", "madreCelular",
  "padreNombre", "padreOcupacion", "padreLugarTrabajo", "padreDui",
  "padreLugarNacimiento", "padreFechaNacimiento", "padreCelular",
];

/* =========================================================
   EDICIÓN DE DATOS
========================================================= */
function establecerEdicion(activa) {
  resultadosSection.querySelectorAll('input[id^="r_"]').forEach((campo) => {
    campo.readOnly = !activa;
    campo.classList.toggle("campo-editable", activa);
  });
  document.getElementById("btnModificar").style.display = activa ? "none" : "inline-block";
  document.getElementById("btnGuardarCambios").style.display = activa ? "inline-block" : "none";
  document.getElementById("btnCancelarCambios").style.display = activa ? "inline-block" : "none";
  // Aplica / quita las mismas restricciones del formulario de Nuevo Ingreso
  if (activa) activarEdicion(resultadosSection);
  else desactivarEdicion(resultadosSection);
}

window.modificarcampos = function () {
  if (!accesoDocente || guardandoCambios) return;
  if (!matriculaActual) {
    alert("⚠️ Primero busque un estudiante.");
    return;
  }
  establecerEdicion(true);
  mostrarPasoFicha(1);
  mostrarMensaje("Puede modificar los datos y luego guardar los cambios o cancelar.", "info");
};

window.cancelarModificacion = function () {
  if (!matriculaActual || guardandoCambios) return;
  mostrarResultados(matriculaActual);
  establecerEdicion(false);
  mostrarMensaje("Modificación cancelada.", "info");
};

window.guardarCambios = async function () {
  if (!accesoDocente || !matriculaActual || guardandoCambios) return;
  const errores = validarMatricula(resultadosSection);
  const cambios = {};
  try {
    const foto = await leerFotoAdministrador(resultadosSection, matriculaActual.fotoEstudiante || matriculaActual.fotoURL);
    if (foto) cambios.fotoEstudiante = foto;
  } catch (error) { mostrarMensaje(error.message, "warning"); return; }
  resultadosSection.querySelectorAll('input[id^="r_"]').forEach((campo) => {
    const clave = campo.id.slice(2);
    if (clave === "conQuienViveOtro") return;
    const valor = campo.value.trim();
    if (valor !== String(matriculaActual[clave] ?? "")) cambios[clave] = valor;
  });
  if (matriculaActual.tipoIngresoPendienteGuardar) cambios.tipoIngreso = document.getElementById("r_tipoIngreso").value;
  const convivencia = document.getElementById("r_conQuienVive").value;
  const convivenciaCompleta = convivencia === "Otros" ? "Otros: " + document.getElementById("r_conQuienViveOtro").value.trim() : convivencia;
  if (convivenciaCompleta !== String(matriculaActual.conQuienVive || "")) cambios.conQuienVive = convivenciaCompleta;
  else delete cambios.conQuienVive;
  if (!Object.keys(cambios).length && !Object.keys(errores).length) {
    establecerEdicion(false);
    mostrarMensaje("No hay cambios para guardar.", "info");
    return;
  }
  // Mismas reglas del formulario de Nuevo Ingreso, aplicadas a lo que se modificó
  if (!Object.keys(errores).length && "nie" in cambios) {
    try {
      const existente = await buscarMatriculaPorNie(cambios.nie);
      if (existente && existente.alumnoId !== matriculaActual.alumnoId) errores.nie = "Ya existe una matrícula con ese NIE";
    } catch (error) {
      console.error("No se pudo comprobar si el NIE ya existe:", error);
      errores.nie = "No se pudo verificar el NIE. Intente nuevamente antes de guardar.";
    }
    if (errores.nie) marcarErrorCampo(resultadosSection, "nie", errores.nie);
  }
  if (Object.keys(errores).length) {
    const primero = document.getElementById("r_" + Object.keys(errores)[0]);
    mostrarPasoFicha(Number(primero?.closest("[data-paso-ficha]")?.dataset.pasoFicha || 1));
    const lista = Object.keys(errores).map((k) => etiquetaCampo(resultadosSection, k)).join(", ");
    mostrarMensaje(`Corrija los campos marcados en rojo: ${lista}.`, "warning");
    return;
  }
  guardandoCambios = true;
  const controles = [document.getElementById("btnGuardarCambios"), document.getElementById("btnCancelarCambios"), buscarInput];
  controles.forEach((control) => (control.disabled = true));
  resultadosSection.querySelectorAll('input[id^="r_"]').forEach((campo) => (campo.readOnly = true));
  mostrarMensaje("Guardando cambios…", "loading");
  try {
    await actualizarMatricula(matriculaActual, cambios);
    Object.assign(matriculaActual, cambios);
    delete matriculaActual.tipoIngresoPendienteGuardar;
    mostrarResultados(matriculaActual);
    establecerEdicion(false);
    prepararDocumentos(matriculaActual);
    mostrarMensaje("✅ Cambios guardados correctamente.", "success");
  } catch (error) {
    establecerEdicion(true);
    mostrarMensaje(`No se pudieron guardar los cambios: ${error.message}`, "error");
  } finally {
    guardandoCambios = false;
    controles.forEach((control) => (control.disabled = false));
  }
};

/* Llena el <select> de tipos de indicaciones una sola vez */
tipoIndicacionesSelect.add(new Option("Complete el tipo de ingreso", ""));
Object.keys(INDICACIONES).forEach((clave) => {
  const opt = document.createElement("option");
  opt.value = clave;
  opt.textContent = INDICACIONES[clave].etiqueta;
  tipoIndicacionesSelect.appendChild(opt);
});

function resolverTipoIngreso(data) {
  const tipo = String(data.tipoIngreso || data.documentosChecklist?.disponibilidadEstudiante?.tipoIngreso || "").trim();
  if (/antiguo/i.test(tipo)) return "Antiguo ingreso";
  if (/nuevo/i.test(tipo)) return "Nuevo ingreso";
  const guardado = data.documentosChecklist?.tipo;
  if (guardado?.endsWith("_antiguo")) return "Antiguo ingreso";
  if (guardado?.endsWith("_nuevo")) return "Nuevo ingreso";
  return "";
}
function detectarTipoIndicaciones(grado, tipoIngreso) {
 const prefijo = { "Primer Año": "primer", "Segundo Año": "segundo", "Tercer Año": "tercer" }[grado];
 if (!prefijo || !tipoIngreso) return "";
 return prefijo + (tipoIngreso === "Antiguo ingreso" ? "_antiguo" : "_nuevo");
}

/* =========================================================
   BÚSQUEDA POR NIE
========================================================= */
window.buscarMatricula = async function () {
  if (!accesoDocente || guardandoCambios) return;
  const valor = buscarInput.value.trim();

  if (!valor) {
    mostrarMensaje("⚠️ Escriba un NIE.", "warning");
    ocultarResultados();
    return;
  }

  if (!nieBusquedaValido(valor)) {
    mostrarMensaje("⚠️ El NIE solo debe contener números (máximo 12 dígitos).", "warning");
    ocultarResultados();
    return;
  }

  try {
    mostrarMensaje("⏳ Buscando...", "loading");
    ocultarResultados();

    const encontrado = await buscarMatriculaPorNie(valor);

    if (!encontrado) {
      mostrarMensaje("❌ No se encontró ningún estudiante con ese NIE.", "error");
      ocultarResultados();
      return;
    }

    matriculaActual = { ...encontrado, tipoIngreso: resolverTipoIngreso(encontrado) };
    matriculaActual.tipoIngresoPendienteGuardar = Boolean(!encontrado.tipoIngreso && matriculaActual.tipoIngreso);
    mostrarMensaje("✅ Estudiante encontrado.", "success");
    mostrarResultados(matriculaActual);
    prepararDocumentos(matriculaActual);
  } catch (error) {
    console.error("❌ Error:", error);
    mostrarMensaje("❌ Error: " + error.message, "error");
    ocultarResultados();
  }
};

/* =========================================================
   MOSTRAR RESULTADOS (VISTA EN PANTALLA)
========================================================= */
function mostrarResultados(data) {
  if (resultadosSection) {
    resultadosSection.style.display = "block";
    resultadosSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  mostrarPasoFicha(1);
  // Al cambiar de estudiante, ocultar el bloque de documentos hasta que lo pidan
  seccionDocumentos.style.display = "none";
  document.getElementById("btnToggleDocumentos").textContent = "📄 Documentos";

  const alertas = document.getElementById("alertasAcademicas");
  if (alertas) {
    const alerta = obtenerAlertaAcademica(data);
    alertas.innerHTML = alerta.html === "—" ? "" : alerta.html;
    alertas.hidden = alerta.html === "—";
  }

  CAMPOS_FICHA.forEach((clave) => {
    const elemento = document.getElementById("r_" + clave);
    if (elemento) elemento.value = data[clave] || "";
  });

  const convivencia = data.conQuienVive || "";
  document.getElementById("r_conQuienVive").value = convivencia.startsWith("Otros:") ? "Otros" : convivencia;
  document.getElementById("r_conQuienViveOtro").value = convivencia.startsWith("Otros:") ? convivencia.slice(6).trim() : "";
  const fotoContenedor = document.getElementById("r_fotoContenedor");
  const fotoImg = document.getElementById("r_fotoEstudiante");
  if (fotoContenedor && fotoImg) {
    if (data.fotoEstudiante || data.fotoURL) {
      fotoImg.src = data.fotoEstudiante || data.fotoURL;
      fotoContenedor.style.display = "block";
    } else {
      fotoImg.removeAttribute("src");
      fotoContenedor.style.display = "none";
    }
  }
}

/* =========================================================
   DOCUMENTOS: PREPARAR / RENDERIZAR CHECKLIST
========================================================= */
function prepararDocumentos(data) {
  const tipoDetectado = resolverTipoIngreso(data) ? detectarTipoIndicaciones(data.grado, resolverTipoIngreso(data)) : "";
  tipoIndicacionesSelect.disabled = true;
  tipoIndicacionesSelect.value = tipoDetectado;

  const guardado = data.documentosChecklist || null;

  renderChecklist(tipoDetectado, guardado);
  if (!INDICACIONES[tipoDetectado]) return;
  observacionesDocumentos.value = guardado?.observaciones || "";
  mensajeDocumentos.textContent = guardado
    ? "ℹ️ Ya existe un registro guardado para este estudiante. Puede editarlo y volver a guardar."
    : "";
}

function renderChecklist(tipo, guardado) {
  const config = INDICACIONES[tipo];

  listaPrincipal.innerHTML = "";
  if (!config) {
    listaGeneral.replaceChildren();
    mensajeDocumentos.textContent = "Complete el tipo de ingreso en Modificar y guarde los cambios para cargar los documentos correspondientes.";
    return;
  }
  config.items.forEach((texto, i) => {
    const previo = guardado && guardado.tipo === tipo && guardado.versionDocumentos === 2
      ? guardado.principal?.[i]
      : guardado?.tipo === tipo ? guardado?.principal?.find((entrada, indice) => {
          const anterior = entrada.texto || DOCUMENTOS_ANTERIORES[guardado.tipo]?.items[indice];
          return anterior && claveDocumento(anterior) === claveDocumento(texto);
        }) : null;
    listaPrincipal.appendChild(crearItemChecklist("principal", i, texto, previo));
  });

  listaGeneral.innerHTML = "";
  INDICACIONES_GENERALES.forEach((texto, i) => {
    const previo = guardado ? guardado.general?.[i] : null;
    listaGeneral.appendChild(crearItemChecklist("general", i, texto, previo));
  });
}

function crearItemChecklist(grupo, indice, texto, previo) {
  const wrapper = document.createElement("div");
  wrapper.className = "checklist-item";
  wrapper.dataset.grupo = grupo;
  wrapper.dataset.indice = indice;

  const marcado = previo?.marcado || false;
  const nota = previo?.nota || "";
  if (marcado) wrapper.classList.add("marcado");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = marcado;
  checkbox.addEventListener("change", () => {
    wrapper.classList.toggle("marcado", checkbox.checked);
  });

  const contenido = document.createElement("div");

  const label = document.createElement("div");
  label.className = "texto-indicacion";
  label.textContent = texto;

  const inputNota = document.createElement("input");
  inputNota.type = "text";
  inputNota.placeholder = "¿Cómo lo trajo? Ej: original y copia, solo copia, pendiente...";
  inputNota.value = nota;

  contenido.appendChild(label);
  contenido.appendChild(inputNota);
  wrapper.appendChild(checkbox);
  wrapper.appendChild(contenido);

  return wrapper;
}

window.toggleDocumentos = function () {
  if (!matriculaActual) {
    alert("⚠️ Primero busque un estudiante.");
    return;
  }
  if (resultadosSection.dataset.edicion === "1") { mostrarMensaje("Guarde o cancele las modificaciones antes de registrar documentos.", "warning"); return; }
  mostrarPasoFicha(6);

};

window.guardarDocumentos = async function () {
  if (!matriculaActual) {
    alert("⚠️ Primero busque un estudiante.");
    return;
  }

  const tipo = resolverTipoIngreso(matriculaActual) ? detectarTipoIndicaciones(matriculaActual.grado, resolverTipoIngreso(matriculaActual)) : "";
  if (!INDICACIONES[tipo]) { mensajeDocumentos.textContent = "Complete y guarde el tipo de ingreso antes de registrar los documentos."; return; }

  const leerGrupo = (grupo) =>
    Array.from(document.querySelectorAll(`#lista${grupo === "principal" ? "Principal" : "General"} .checklist-item`))
      .map((item) => ({
        marcado: item.querySelector('input[type="checkbox"]').checked,
        nota: item.querySelector('input[type="text"]').value.trim(),
        texto: item.querySelector(".texto-indicacion")?.textContent || "",
      }));

  const registro = {
    ...matriculaActual.documentosChecklist,
    tipo,
    versionDocumentos: 2,
    principal: leerGrupo("principal"),
    general: leerGrupo("general"),
    observaciones: observacionesDocumentos.value.trim(),
    actualizado: new Date().toISOString(),
    revisadoPorNombre: sessionStorage.getItem("nombreUsuario") || "Docente",
    revisadoPorCorreo: sessionStorage.getItem("correoUsuario") || "",
  };

  try {
    mensajeDocumentos.textContent = "⏳ Guardando...";
    mensajeDocumentos.style.color = "#1976d2";

    const reciente = await buscarMatriculaPorNie(matriculaActual.nie);
    if (!reciente || reciente.id !== matriculaActual.id) throw new Error("Busque nuevamente al estudiante.");
    if (reciente.documentosChecklist?.actaCoordinador) registro.actaCoordinador = reciente.documentosChecklist.actaCoordinador;
    await guardarDocumentosSupabase(matriculaActual, registro);

    matriculaActual.documentosChecklist = registro;

    mensajeDocumentos.textContent = "✅ Registro de documentos guardado. El administrador podrá verlo.";
    mensajeDocumentos.style.color = "#2e7d32";
  } catch (error) {
    console.error("❌ Error al guardar documentos:", error);
    mensajeDocumentos.textContent = "❌ Error al guardar: " + error.message;
    mensajeDocumentos.style.color = "#d32f2f";
  }
};

/* =========================================================
   MENSAJES
========================================================= */
function mostrarMensaje(texto, tipo = "info") {
  if (!mensajeBusqueda) return;

  mensajeBusqueda.textContent = texto;

  const estilos = {
    error: { color: "#d32f2f", bg: "#ffebee", border: "#d32f2f" },
    warning: { color: "#f57c00", bg: "#fff3e0", border: "#f57c00" },
    loading: { color: "#1976d2", bg: "#e3f2fd", border: "#1976d2" },
    success: { color: "#2e7d32", bg: "#e8f5e9", border: "#2e7d32" },
    info: { color: "#1a3a2b", bg: "#e8f0fe", border: "#1a3a2b" },
  };

  const estilo = estilos[tipo] || estilos.info;
  mensajeBusqueda.style.color = estilo.color;
  mensajeBusqueda.style.backgroundColor = estilo.bg;
  mensajeBusqueda.style.padding = "10px";
  mensajeBusqueda.style.borderRadius = "8px";
  mensajeBusqueda.style.border = `2px solid ${estilo.border}`;
}

function ocultarResultados() {
  establecerEdicion(false);
  if (resultadosSection) resultadosSection.style.display = "none";
  matriculaActual = null;
}

/* Alertas de repitiente / sobreedad (mismas reglas que el administrador) */
function obtenerAlertaAcademica(matricula) {
  const grado = matricula.grado || "";
  const ultimoAnio = matricula.ultimoAnioAprobado || "";
  const edad = Number.parseInt(matricula.edad, 10);
  const maximaPorGrado = { "Primer Año": 18, "Segundo Año": 20, "Tercer Año": 20 };
  const esSobreedad = Number.isFinite(edad) && (
    (grado === "Primer Año" && edad >= maximaPorGrado[grado]) ||
    (grado !== "Primer Año" && edad > maximaPorGrado[grado])
  );

  const esRepitiente = !!grado && ultimoAnio === grado;
  const alertas = [];
  if (esRepitiente) alertas.push('<span class="badge-alerta badge-repitiente">Repitiendo año</span>');
  if (esSobreedad) alertas.push('<span class="badge-alerta badge-sobreedad">Sobreedad</span>');
  return {
    claseFila: esSobreedad ? "fila-sobreedad" : (esRepitiente ? "fila-repitiente" : ""),
    html: alertas.length ? alertas.join(" ") : "—",
    esRepitiente,
    esSobreedad,
  };
}

/* =========================================================
   BUSCAR CON ENTER
========================================================= */
if (buscarInput) {
  restringirBuscadorNie(buscarInput, 12);
  buscarInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      window.buscarMatricula();
    }
  });

  buscarInput.addEventListener("focus", function () {
    if (!matriculaActual) {
      mostrarMensaje("💡 Ingrese el NIE del estudiante para buscar.", "info");
    }
  });
}

/* =========================================================
   INICIALIZACIÓN
========================================================= */
console.log("✅ Panel docente INCO cargado correctamente");
mostrarMensaje("💡 Ingrese el NIE del estudiante para buscar.", "info");
function iniciarFormatoFicha() {
  const card = resultadosSection.querySelector('.card-resultado');
  const campos = new Map(Array.from(card.querySelectorAll('input[id^="r_"]'), el => [el.id.slice(2), el.closest('.campo')]));
  campos.set('foto', document.getElementById('editarFotoAdministrador'));
  const grupos = [
    ['Datos del Alumno', ['nie','duiEstudiante','primerApellido','segundoApellido','primerNombre','segundoNombre','lugarNacimiento','fechaNacimiento','edad','grado','sexo','telefonoEstudiante','correoEstudiantil','correoPersonal','foto']],
    ['Información Académica', ['especialidad','ultimoAnioAprobado','colegioAnterior','tipoIngreso','hermanosCentroeducativo','nombresHermanos','nivelAcademico']],
    ['Recursos, Transporte y Residencia', ['computadoraMineducyt','internet','tallaCamisa','tallaPantalon','tallaBlusa','tallaFalda','tallaZapatos','tipoTransporte','distanciaKm','zonaResidencia','conQuienVive','conQuienViveOtro','direccionResidencia']],
    ['Salud y Responsable', ['enfermedad','cualEnfermedad','medicamento','otros','responsable','parentesco','duiResponsable','telefonoResponsable','whatsappResponsable','correoResponsable']],
    ['Datos de la Madre y del Padre', ['madreNombre','madreOcupacion','madreLugarTrabajo','madreDui','madreLugarNacimiento','madreFechaNacimiento','madreCelular','padreNombre','padreOcupacion','padreLugarTrabajo','padreDui','padreLugarNacimiento','padreFechaNacimiento','padreCelular']]
  ];
  const titulo = document.createElement('h3');titulo.textContent = 'Ficha de inscripción';
  const meta = document.createElement('div');meta.className='grid-2';
  ['numeroFicha','fechaMatricula'].forEach(k=>meta.appendChild(campos.get(k)));
  const progreso = document.createElement('p');progreso.id='progresoFichaDocente';progreso.setAttribute('role','status');
  const nav = document.createElement('nav');nav.className='pasos-ficha';nav.setAttribute('aria-label','Secciones del formulario');
  const secciones = grupos.map(([nombre,keys],i)=>{
    const seccion=document.createElement('section');seccion.dataset.pasoFicha=String(i+1);seccion.className='paso-ficha';
    const h=document.createElement('h2');h.textContent=nombre;seccion.appendChild(h);
    const grid=document.createElement('div');grid.className='grid-2';
    keys.forEach(k=>{const el=campos.get(k);if(el)grid.appendChild(el);});seccion.appendChild(grid);return seccion;
  });
  [...grupos.map(g=>g[0]),'Documentos'].forEach((nombre,i)=>{
    const boton=document.createElement('button');boton.type='button';boton.textContent=(i+1)+'. '+nombre;boton.dataset.irPaso=String(i+1);
    boton.addEventListener('click',()=>i===5?window.toggleDocumentos():mostrarPasoFicha(i+1));nav.appendChild(boton);
  });
  const foto=document.getElementById('r_fotoContenedor');const alertas=document.getElementById('alertasAcademicas');
  const barra=document.createElement('progress');barra.id='barraProgresoFicha';barra.max=6;barra.value=1;barra.setAttribute('aria-label','Progreso del formulario');
  card.replaceChildren(titulo,meta,alertas,foto,progreso,barra,nav,...secciones);
  const controles=document.createElement('div');controles.className='navegacion-ficha';
  const anterior=document.createElement('button');anterior.type='button';anterior.textContent='Anterior';anterior.id='anteriorFicha';anterior.onclick=()=>mostrarPasoFicha(Math.max(1,Number(card.dataset.paso||1)-1));
  const siguiente=document.createElement('button');siguiente.type='button';siguiente.textContent='Siguiente';siguiente.id='siguienteFicha';siguiente.onclick=()=>{const paso=Number(card.dataset.paso||1);if(paso===5)window.toggleDocumentos();else mostrarPasoFicha(paso+1);};
  controles.append(anterior,siguiente);card.appendChild(controles);mostrarPasoFicha(1);
}
function mostrarPasoFicha(paso) {
  const card=resultadosSection.querySelector('.card-resultado');
  if(!card?.querySelector('[data-paso-ficha]'))return;
  card.dataset.paso=String(paso);
  document.getElementById('barraProgresoFicha').value=paso;
  card.querySelectorAll('[data-paso-ficha]').forEach(el=>el.hidden=Number(el.dataset.pasoFicha)!==paso);
  card.querySelectorAll('[data-ir-paso]').forEach(el=>el.setAttribute('aria-current',Number(el.dataset.irPaso)===paso?'step':'false'));
  document.getElementById('progresoFichaDocente').textContent='Paso '+paso+' de 6';
  document.getElementById('anteriorFicha').disabled=paso===1;
  document.getElementById('siguienteFicha').hidden=paso===6;
  seccionDocumentos.style.display=paso===6?'block':'none';
  document.getElementById('btnToggleDocumentos').textContent='📄 Documentos';
}
window.mostrarBusquedaDocente = function() {
  document.getElementById('seccionInscritos').hidden=true;
  document.getElementById('seccionMatricula').hidden=false;
  resultadosSection.style.display=matriculaActual?'block':'none';
  document.getElementById('menuBuscarDocente').classList.add('activo');
  document.getElementById('menuInscritosDocente').classList.remove('activo');
};
window.mostrarInscritos = async function() {
  if(!accesoDocente)return;
  if(guardandoCambios || resultadosSection.dataset.edicion==='1'){mostrarMensaje('Guarde o cancele las modificaciones antes de abrir Inscritos.','warning');return;}
  document.getElementById('seccionMatricula').hidden=true;
  resultadosSection.style.display='none';
  document.getElementById('seccionInscritos').hidden=false;
  document.getElementById('menuBuscarDocente').classList.remove('activo');
  document.getElementById('menuInscritosDocente').classList.add('activo');
  const mensaje=document.getElementById('mensajeInscritos'),cuerpo=document.getElementById('listaInscritos');
  cuerpo.replaceChildren();mensaje.textContent='Cargando inscritos…';
  try {
    const inscritos=await listarMatriculas();
    for(const registro of inscritos){
      const fila=document.createElement('tr');
      const nombre=[registro.primerNombre,registro.segundoNombre,registro.primerApellido,registro.segundoApellido].filter(Boolean).join(' ');
      [registro.numeroFicha,registro.nie,nombre,registro.grado,registro.especialidad,resolverTipoIngreso(registro)||'Pendiente de completar'].forEach(v=>{const td=document.createElement('td');td.textContent=v||'—';fila.appendChild(td);});
      const td=document.createElement('td'),boton=document.createElement('button');boton.type='button';boton.textContent='Ver ficha';
      boton.onclick=async()=>{window.mostrarBusquedaDocente();buscarInput.value=registro.nie;await window.buscarMatricula();};td.appendChild(boton);fila.appendChild(td);cuerpo.appendChild(fila);
    }
    mensaje.textContent=inscritos.length?inscritos.length+' estudiante(s) inscrito(s).':'No hay estudiantes inscritos.';
  } catch(error){mensaje.textContent='No se pudo cargar el listado: '+error.message;}
};
iniciarFormatoFicha();
