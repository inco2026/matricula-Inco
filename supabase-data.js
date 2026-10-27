import { supabase } from "./supabase-config.js";

const SELECCION_COMPLETA = `
  *,
  alumnos!inner (
    *,
    padres (*), responsables (*), salud (*), residencias (*), recursos (*)
  ),
  estudios (*),
  documentos_matricula (*)
`;

function uno(valor) {
  return Array.isArray(valor) ? (valor[0] || null) : (valor || null);
}

// Evita que las búsquedas dejen la pantalla cargando indefinidamente.
async function conTiempoMaximo(promesa, milisegundos = 10000) {
  let temporizador;
  try {
    return await Promise.race([
      promesa,
      new Promise((_, rechazar) => {
        temporizador = setTimeout(() => rechazar(new Error("La búsqueda tardó más de 10 segundos. Intente nuevamente.")), milisegundos);
      }),
    ]);
  } finally {
    clearTimeout(temporizador);
  }
}

function fechaParaFormulario(valor) {
  if (!valor) return "";
  const partes = String(valor).split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valor;
}

function fechaParaBD(valor) {
  if (!valor) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const partes = String(valor).split("/");
  return partes.length === 3 ? `${partes[2]}-${partes[1]}-${partes[0]}` : valor;
}

function aDocumentoPlano(fila) {
  if (!fila) return null;
  const a = uno(fila.alumnos) || {};
  const e = uno(fila.estudios) || {};
  const p = uno(a.padres) || {};
  const r = uno(a.responsables) || {};
  const s = uno(a.salud) || {};
  const residencia = uno(a.residencias) || {};
  const recursos = uno(a.recursos) || {};
  const docs = uno(fila.documentos_matricula);

  let documentosChecklist = null;
  if (docs) {
    documentosChecklist = {
      ...(docs.items && typeof docs.items === "object" ? docs.items : {}),
      tipo: docs.tipo_indicaciones || docs.items?.tipo || "",
      observaciones: docs.observaciones || docs.items?.observaciones || "",
      actualizado: docs.actualizado_en || docs.items?.actualizado || "",
      actualizadoPor: docs.actualizado_por || null,
    };
  }

  const formulario = fila.datos_formulario || {};
  const condiciones = formulario.condicionesSalud || [];
  return {
    datosFormulario: formulario,
    paisNacimiento: a.pais_nacimiento || formulario.paisNacimiento || "",
    tipoModalidad: fila.tipo_modalidad || formulario.tipoModalidad || "",
    id: fila.id,
    alumnoId: fila.alumno_id,
    numeroFicha: fila.numero_ficha || "",
    fechaMatricula: fechaParaFormulario(fila.fecha_matricula),
    horaMatricula: fila.hora_matricula || "",
    grado: fila.grado || "",
    especialidad: fila.especialidad || "",
    tipoIngreso: fila.tipo_ingreso || "",
    estado: fila.estado || "",
    revisionCompleta: typeof fila.revision_completa === "boolean" ? fila.revision_completa : null,
    revisadoPorNombre: fila.revisado_por_nombre || "",
    revisadoEn: fila.revisado_en || "",
    fechaRegistro: fila.creado_en || "",

    nie: a.nie || "",
    duiEstudiante: a.dui || "",
    primerNombre: a.primer_nombre || "",
    segundoNombre: a.segundo_nombre || "",
    primerApellido: a.primer_apellido || "",
    segundoApellido: a.segundo_apellido || "",
    fechaNacimiento: a.fecha_nacimiento || "",
    lugarNacimiento: a.lugar_nacimiento || "",
    edad: a.edad ?? "",
    sexo: a.sexo || "",
    telefonoEstudiante: a.telefono || "",
    correoEstudiantil: a.correo_estudiantil || "",
    correoPersonal: a.correo_personal || "",
    fotoEstudiante: a.foto_base64 || "",

    ultimoAnioAprobado: e.ultimo_anio_aprobado || "",
    colegioAnterior: e.colegio_anterior || "",
    hermanosCentroeducativo: e.hermanos_centroeducativo || "",
    nombresHermanos: e.nombres_hermanos || "",
    nivelAcademico: e.nivel_academico || "",
    partidaNumero: e.partida_numero || "",
    folio: e.folio || "",
    tomo: e.tomo || "",
    libro: e.libro || "",

    padreNombre: p.padre_nombre || "",
    padreDui: p.padre_dui || "",
    padreFechaNacimiento: p.padre_fecha_nacimiento || "",
    padreLugarNacimiento: p.padre_lugar_nacimiento || "",
    padreOcupacion: p.padre_ocupacion || "",
    padreLugarTrabajo: p.padre_lugar_trabajo || "",
    padreCelular: p.padre_celular || "",
    madreNombre: p.madre_nombre || "",
    madreDui: p.madre_dui || "",
    madreFechaNacimiento: p.madre_fecha_nacimiento || "",
    madreLugarNacimiento: p.madre_lugar_nacimiento || "",
    madreOcupacion: p.madre_ocupacion || "",
    madreLugarTrabajo: p.madre_lugar_trabajo || "",
    madreCelular: p.madre_celular || "",

    responsable: r.nombre || "",
    parentesco: r.parentesco || "",
    duiResponsable: r.dui || "",
    telefonoResponsable: r.telefono || "",
    whatsappResponsable: r.whatsapp || "",
    correoResponsable: r.correo || "",

    vacunaCovid: s.vacuna_covid || "",
    enfermedad: s.enfermedad || "",
    cualEnfermedad: s.cual_enfermedad || condiciones.map(c => c.enfermedad || "").join("; "),
    medicamento: s.medicamento || condiciones.map(c => c.medicamento || "").join("; "),
    otros: s.otros || condiciones.map(c => c.otros || "").join("; "),

    direccionResidencia: residencia.direccion || "",
    zonaResidencia: residencia.zona || "",
    distanciaKm: residencia.distancia_km ?? "",
    tipoTransporte: residencia.tipo_transporte || "",
    conQuienVive: residencia.con_quien_vive || "",

    computadoraMineducyt: recursos.computadora_mineducyt || "",
    internet: recursos.internet || "",
    tallaCamisa: recursos.talla_camisa || "",
    tallaPantalon: recursos.talla_pantalon || "",
    tallaBlusa: recursos.talla_blusa || "",
    tallaFalda: recursos.talla_falda || "",
    tallaZapatos: recursos.talla_zapatos || "",
    documentosChecklist,
  };
}

async function nieYaExiste(valorNie) {
  const { data, error } = await supabase.rpc("nie_ya_existe", { p_nie: valorNie });
  if (error) throw error;
  return Boolean(data);
}

async function obtenerSiguienteFicha() {
  const { data, error } = await supabase.rpc("siguiente_numero_ficha");
  if (error) throw error;
  return data;
}

async function crearMatricula(datos) {
  const { data, error } = await supabase.rpc("crear_matricula", { p: datos });
  if (error) throw error;
  return { id: data };
}

async function buscarMatriculaPorNie(nie) {
  const { data, error } = await conTiempoMaximo(supabase
    .from("matriculas")
    .select(SELECCION_COMPLETA)
    .eq("alumnos.nie", nie)
    .order("anio_lectivo", { ascending: false })
    .limit(1)
    .maybeSingle());
  if (error) throw error;
  return aDocumentoPlano(data);
}

// El reporte no necesita fotografías ni la ficha completa de cada estudiante.
const SELECCION_REPORTE = `
  *,
  alumnos!inner (id, nie, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, edad),
  estudios (ultimo_anio_aprobado),
  documentos_matricula (*)
`;

async function listarMatriculas() {
  return conTiempoMaximo((async () => {
    const filas = [];
    const tamano = 500;
    for (let inicio = 0; ; inicio += tamano) {
      const { data, error } = await supabase
        .from("matriculas")
        .select(SELECCION_REPORTE)
        .order("creado_en", { ascending: false })
        .order("id", { ascending: false })
        .range(inicio, inicio + tamano - 1);
      if (error) throw error;
      filas.push(...(data || []));
      if (!data || data.length < tamano) break;
    }
    return filas.map(aDocumentoPlano);
  })());
}

// La descarga obtiene todas las relaciones solo para los resultados seleccionados.
async function obtenerMatriculasParaExcel(ids) {
  const registros = [];
  for (let inicio = 0; inicio < ids.length; inicio += 50) {
    const { data, error } = await conTiempoMaximo(supabase.from("matriculas")
      .select("*, alumnos!inner (*, padres (*), responsables (*), salud (*), residencias (*), recursos (*)), estudios (*), documentos_matricula (*)")
      .in("id", ids.slice(inicio, inicio + 50)));
    if (error) throw error;
    registros.push(...(data || []));
  }
  const porId = new Map(registros.map(fila => [fila.id, fila]));
  return ids.map(id => {
    const fila = porId.get(id);
    if (!fila) throw new Error("Una matrícula ya no está disponible. Repita la búsqueda antes de descargar.");
    return { ...aDocumentoPlano(fila), datosCompletos: fila };
  });
}

async function listarDocentes() {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, correo, rol, creado_en")
    .eq("rol", "docente")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function listarUsuarios() {
  const { data, error } = await supabase.from("perfiles")
    .select("*").order("nombre", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function crearUsuario({ nombre, correo, contrasena, rol }) {
  if (!["administrador", "coordinador", "docente"].includes(rol)) throw new Error("Seleccione un rol válido.");
  const { data: { session }, error: errorSesion } = await supabase.auth.getSession();
  if (errorSesion || !session?.access_token) throw new Error("La sesión expiró. Cierre sesión e ingrese nuevamente.");
  // Verificar la identidad real y su perfil, no el rol guardado en sessionStorage.
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getUser(session.access_token);
  if (errorIdentidad || !identidad?.user) throw new Error("La sesión no es válida. Cierre sesión e ingrese nuevamente.");
  const { data: perfil, error: errorPerfil } = await supabase.from("perfiles")
    .select("*").eq("id", identidad.user.id).single();
  if (errorPerfil) throw new Error("No se pudo consultar su permiso de administrador. Código: " + (errorPerfil.code || "sin detalle"));
  if (perfil?.activo === false) throw new Error("Su cuenta está inhabilitada.");
  if (perfil?.rol !== "administrador") throw new Error("La cuenta conectada " + (identidad.user.email || "") + " no tiene rol de administrador.");
  const { data, error } = await supabase.functions.invoke("crear-usuario", {
    body: { nombre, correo, contrasena, rol },
    headers: { Authorization: "Bearer " + session.access_token },
  });
  if (error) {
    let detalle = "";
    try { detalle = (await error.context?.clone().json())?.error || ""; } catch {}
    if (/solo un administrador puede crear usuarios/i.test(detalle)) {
      throw new Error("Su cuenta " + (identidad.user.email || "") + " sí está verificada como administrador, pero la función publicada rechazó el permiso. Debe revisarse crear-usuario en Supabase. No cambie más cuentas ni roles.");
    }
    throw new Error(detalle || error.message || "No se pudo crear el usuario.");
  }
  if (!data?.ok || data.usuario?.rol !== rol) throw new Error(data?.error || "No se pudo confirmar el rol del usuario. Consulte al encargado técnico antes de reintentar.");
  return data.usuario;
}

async function revisarMatricula(id, completa) {
  if (typeof completa !== "boolean") throw new Error("Seleccione completo o incompleto.");
  const { data, error } = await supabase.rpc("revisar_matricula", { p_id: id, p_completa: completa });
  if (error) throw new Error(error.code === "PGRST202" ? "Falta activar la revisión administrativa en Supabase." : error.message);
  if (!data || data.id !== id || data.revision_completa !== completa) throw new Error("No se pudo confirmar la revisión.");
  return data;
}

async function cambiarEstadoUsuario(id, activo) {
  if (typeof activo !== "boolean") throw new Error("Estado inválido.");
  const { data, error } = await supabase.rpc("cambiar_estado_usuario", { p_id: id, p_activo: activo });
  if (error) throw new Error(error.code === "PGRST202" ? "Falta activar la inhabilitación de usuarios en Supabase." : error.message);
  if (!data || data.id !== id || data.activo !== activo) throw new Error("No se pudo confirmar el cambio de estado.");
  return data;
}

async function crearDocente(datos) { return crearUsuario({ ...datos, rol: "docente" }); }

async function obtenerPerfil(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, correo, rol, creado_en")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function seleccionarCambios(cambios, mapa) {
  const salida = {};
  for (const [campoJs, campoBd] of Object.entries(mapa)) {
    if (Object.prototype.hasOwnProperty.call(cambios, campoJs)) {
      salida[campoBd] = cambios[campoJs] === "" ? null : cambios[campoJs];
    }
  }
  return salida;
}

async function actualizarMatricula(registro, cambios) {
  const tareas = [];
  const agregar = (tabla, valores, columna, id) => {
    if (Object.keys(valores).length) tareas.push(supabase.from(tabla).update(valores).eq(columna, id).select("id").single());
  };

  const datosMatricula = seleccionarCambios(cambios, {
    numeroFicha: "numero_ficha", grado: "grado", especialidad: "especialidad",
    tipoIngreso: "tipo_ingreso", tipoModalidad: "tipo_modalidad", estado: "estado",
  });
  if (Object.prototype.hasOwnProperty.call(cambios, "fechaMatricula")) {
    datosMatricula.fecha_matricula = fechaParaBD(cambios.fechaMatricula);
  }
  if (registro.datosFormulario && Object.keys(registro.datosFormulario).length) {
    datosMatricula.datos_formulario = { ...registro.datosFormulario, ...cambios };
    delete datosMatricula.datos_formulario.fotoEstudiante;
    if (["cualEnfermedad", "medicamento", "otros"].some(k => Object.prototype.hasOwnProperty.call(cambios,k))) delete datosMatricula.datos_formulario.condicionesSalud;
  }
  agregar("matriculas", datosMatricula, "id", registro.id);

  const datosAlumno = seleccionarCambios(cambios, {
    nie: "nie", duiEstudiante: "dui", primerNombre: "primer_nombre",
    segundoNombre: "segundo_nombre", primerApellido: "primer_apellido",
    segundoApellido: "segundo_apellido", lugarNacimiento: "lugar_nacimiento",
    edad: "edad", sexo: "sexo", telefonoEstudiante: "telefono",
    correoEstudiantil: "correo_estudiantil", correoPersonal: "correo_personal",
    fotoEstudiante: "foto_base64", paisNacimiento: "pais_nacimiento",
  });
  if (Object.prototype.hasOwnProperty.call(cambios, "fechaNacimiento")) {
    datosAlumno.fecha_nacimiento = fechaParaBD(cambios.fechaNacimiento);
  }
  agregar("alumnos", datosAlumno, "id", registro.alumnoId);

  agregar("estudios", seleccionarCambios(cambios, {
    ultimoAnioAprobado: "ultimo_anio_aprobado", colegioAnterior: "colegio_anterior",
    hermanosCentroeducativo: "hermanos_centroeducativo", nombresHermanos: "nombres_hermanos",
    nivelAcademico: "nivel_academico", partidaNumero: "partida_numero",
    folio: "folio", tomo: "tomo", libro: "libro",
  }), "matricula_id", registro.id);

  agregar("recursos", seleccionarCambios(cambios, {
    computadoraMineducyt: "computadora_mineducyt", internet: "internet",
    tallaCamisa: "talla_camisa", tallaPantalon: "talla_pantalon",
    tallaBlusa: "talla_blusa", tallaFalda: "talla_falda", tallaZapatos: "talla_zapatos",
  }), "alumno_id", registro.alumnoId);

  agregar("salud", seleccionarCambios(cambios, {
    vacunaCovid: "vacuna_covid", enfermedad: "enfermedad",
    cualEnfermedad: "cual_enfermedad", medicamento: "medicamento", otros: "otros",
  }), "alumno_id", registro.alumnoId);

  agregar("responsables", seleccionarCambios(cambios, {
    responsable: "nombre", parentesco: "parentesco", duiResponsable: "dui",
    telefonoResponsable: "telefono", whatsappResponsable: "whatsapp", correoResponsable: "correo",
  }), "alumno_id", registro.alumnoId);

  const datosPadres = seleccionarCambios(cambios, {
    madreNombre: "madre_nombre", madreOcupacion: "madre_ocupacion",
    madreLugarTrabajo: "madre_lugar_trabajo", madreDui: "madre_dui",
    madreLugarNacimiento: "madre_lugar_nacimiento", madreCelular: "madre_celular",
    padreNombre: "padre_nombre", padreOcupacion: "padre_ocupacion",
    padreLugarTrabajo: "padre_lugar_trabajo", padreDui: "padre_dui",
    padreLugarNacimiento: "padre_lugar_nacimiento", padreCelular: "padre_celular",
  });
  if (Object.prototype.hasOwnProperty.call(cambios, "madreFechaNacimiento")) datosPadres.madre_fecha_nacimiento = fechaParaBD(cambios.madreFechaNacimiento);
  if (Object.prototype.hasOwnProperty.call(cambios, "padreFechaNacimiento")) datosPadres.padre_fecha_nacimiento = fechaParaBD(cambios.padreFechaNacimiento);
  agregar("padres", datosPadres, "alumno_id", registro.alumnoId);

  const resultados = await Promise.all(tareas);
  const fallo = resultados.find((resultado) => resultado.error);
  if (fallo) throw fallo.error;
}

async function guardarDocumentos(registro, documentos) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("documentos_matricula")
    .update({
      tipo_indicaciones: documentos.tipo,
      items: documentos,
      observaciones: documentos.observaciones,
      actualizado_por: user?.id || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq("matricula_id", registro.id)
    .select("matricula_id");
  if (error) throw error;
  if (!data?.length) throw new Error("No se guardó el registro de documentos. Verifique los permisos y que exista el registro del estudiante.");
}

async function eliminarMatricula(registro) {
  const { error: errorMatricula } = await supabase.from("matriculas").delete().eq("id", registro.id);
  if (errorMatricula) throw errorMatricula;

  const { count, error: errorConteo } = await supabase
    .from("matriculas")
    .select("id", { count: "exact", head: true })
    .eq("alumno_id", registro.alumnoId);
  if (errorConteo) throw errorConteo;
  if (count === 0) {
    const { error: errorAlumno } = await supabase.from("alumnos").delete().eq("id", registro.alumnoId);
    if (errorAlumno) throw errorAlumno;
  }
}

export {
  actualizarMatricula,
  buscarMatriculaPorNie,
  crearDocente,
  crearUsuario,
  cambiarEstadoUsuario,
  revisarMatricula,
  crearMatricula,
  eliminarMatricula,
  guardarDocumentos,
  listarDocentes,
  listarUsuarios,
  obtenerMatriculasParaExcel,
  listarMatriculas,
  nieYaExiste,
  obtenerPerfil,
  obtenerSiguienteFicha,
};
