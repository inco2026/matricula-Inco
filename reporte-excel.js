// Columnas del formulario: una fila por estudiante, sin identificadores internos.
export const CAMPOS_FORMULARIO_EXCEL = [
  ["tipoModalidad", "Tipo de modalidad"],
  [
    "numeroFicha",
    "Número de ficha"
  ],
  [
    "fechaMatricula",
    "Fecha de matrícula"
  ],
  [
    "horaMatricula",
    "Hora de matrícula"
  ],
  [
    "nie",
    "NIE del estudiante"
  ],
  [
    "duiEstudiante",
    "DUI del estudiante"
  ],
  [
    "primerNombre",
    "Primer nombre del estudiante"
  ],
  [
    "segundoNombre",
    "Segundo nombre del estudiante"
  ],
  [
    "primerApellido",
    "Primer apellido del estudiante"
  ],
  [
    "segundoApellido",
    "Segundo apellido del estudiante"
  ],
  [
    "paisNacimiento",
    "País de nacimiento"
  ],
  [
    "lugarNacimiento",
    "Lugar de nacimiento del estudiante"
  ],
  [
    "fechaNacimiento",
    "Fecha de nacimiento del estudiante"
  ],
  [
    "edad",
    "Edad del estudiante"
  ],
  [
    "sexo",
    "Sexo del estudiante"
  ],
  [
    "telefonoEstudiante",
    "Teléfono del estudiante"
  ],
  [
    "correoEstudiantil",
    "Correo estudiantil"
  ],
  [
    "correoPersonal",
    "Correo personal del estudiante"
  ],
  [
    "grado",
    "Grado / año de estudio"
  ],
  [
    "especialidad",
    "Especialidad"
  ],
  [
    "tipoIngreso",
    "Tipo de ingreso"
  ],
  [
    "ultimoAnioAprobado",
    "Último año aprobado"
  ],
  [
    "colegioAnterior",
    "Centro educativo anterior"
  ],
  [
    "hermanosCentroeducativo",
    "¿Tiene hermanos en el centro educativo?"
  ],
  [
    "nombresHermanos",
    "Hermanos: nombre, grado y NIE"
  ],
  [
    "computadoraMineducyt",
    "¿Tiene computadora del MINEDUCYT?"
  ],
  [
    "internet",
    "¿Tiene acceso a internet?"
  ],
  [
    "tallaCamisa",
    "Talla de camisa"
  ],
  [
    "tallaPantalon",
    "Talla de pantalón"
  ],
  [
    "tallaBlusa",
    "Talla de blusa"
  ],
  [
    "tallaFalda",
    "Talla de falda"
  ],
  [
    "tallaZapatos",
    "Talla de zapatos"
  ],
  [
    "tipoTransporte",
    "Tipo de transporte"
  ],
  [
    "distanciaKm",
    "Distancia al centro educativo (km)"
  ],
  [
    "zonaResidencia",
    "Zona de residencia"
  ],
  [
    "conQuienVive",
    "¿Con quién vive?"
  ],
  [
    "direccionResidencia",
    "Dirección de residencia"
  ],
  [
    "enfermedad",
    "¿Tiene alguna enfermedad?"
  ],
  [
    "cualEnfermedad",
    "Enfermedades o condiciones de salud"
  ],
  [
    "medicamento",
    "Medicamentos"
  ],
  [
    "otros",
    "Otras observaciones de salud"
  ],
  [
    "responsable",
    "Nombre completo del responsable"
  ],
  [
    "parentesco",
    "Parentesco del responsable"
  ],
  [
    "duiResponsable",
    "DUI del responsable"
  ],
  [
    "telefonoResponsable",
    "Teléfono del responsable"
  ],
  [
    "whatsappResponsable",
    "WhatsApp del responsable"
  ],
  [
    "correoResponsable",
    "Correo del responsable"
  ],
  [
    "madreNombre",
    "Nombre completo de la madre"
  ],
  [
    "madreOcupacion",
    "Ocupación de la madre"
  ],
  [
    "madreLugarTrabajo",
    "Lugar de trabajo de la madre"
  ],
  [
    "madreDui",
    "DUI de la madre"
  ],
  [
    "madreCelular",
    "Celular de la madre"
  ],
  [
    "padreNombre",
    "Nombre completo del padre"
  ],
  [
    "padreOcupacion",
    "Ocupación del padre"
  ],
  [
    "padreLugarTrabajo",
    "Lugar de trabajo del padre"
  ],
  [
    "padreDui",
    "DUI del padre"
  ],
  [
    "padreCelular",
    "Celular del padre"
  ]
];
const uno = valor => Array.isArray(valor) ? (valor[0] || {}) : (valor || {});
function datosFormulario(m) {
  const raw = m.datosCompletos || {};
  const alumno = uno(raw.alumnos);
  const estudios = uno(raw.estudios);
  const salud = uno(alumno.salud);
  const hermanos = estudios.hermanos;
  const condiciones = salud.condiciones_salud || salud.condiciones;
  const datos = { ...m, paisNacimiento: m.paisNacimiento || alumno.pais_nacimiento || '' };
  if (Array.isArray(hermanos) && hermanos.length) datos.nombresHermanos = hermanos.map(h => [h.nombre, h.grado, h.nie ? 'NIE: ' + h.nie : ''].filter(Boolean).join(' — ')).join('; ');
  if (Array.isArray(condiciones) && condiciones.length) {
    datos.cualEnfermedad = condiciones.map(c => c.enfermedad || '').join('; ');
    datos.medicamento = condiciones.map(c => c.medicamento || '').join('; ');
    datos.otros = condiciones.map(c => c.otros || '').join('; ');
  }
  return datos;
}
export function prepararReporteCompleto(registros, alerta = () => '', estado = m => m.estado) {
  const grupos = new Map();
  for (const m of registros) {
    const clave = JSON.stringify([m.grado || '', m.especialidad || '']);
    if (!grupos.has(clave)) grupos.set(clave, { grado: m.grado || '', especialidad: m.especialidad || '', total: 0, inscritos: 0, matriculados: 0 });
    const grupo = grupos.get(clave);
    grupo.total++;
    if (estado(m) === 'Matriculado') grupo.matriculados++; else grupo.inscritos++;
  }
  const resumen = [...grupos.values()].sort((a,b) => a.grado.localeCompare(b.grado,'es') || a.especialidad.localeCompare(b.especialidad,'es'));
  return {
    encabezados: [...CAMPOS_FORMULARIO_EXCEL.map(([, etiqueta]) => etiqueta), 'Situación de matrícula', 'Alerta académica'],
    filas: registros.map(m => {
      const datos = datosFormulario(m);
      return [...CAMPOS_FORMULARIO_EXCEL.map(([campo]) => datos[campo] ?? ''), estado(m) || '', alerta(m)];
    }),
    hojasAdicionales: [{
      nombre: 'Resumen por grado',
      titulo: 'Cantidad de estudiantes por grado y especialidad (resultados de la búsqueda)',
      encabezados: ['Grado / año de estudio', 'Especialidad', 'Total de estudiantes', 'Inscritos pendientes', 'Matriculados'],
      filas: [...resumen.map(g => [g.grado, g.especialidad, g.total, g.inscritos, g.matriculados]),
        ['TOTAL', '', registros.length, resumen.reduce((s,g) => s + g.inscritos,0), resumen.reduce((s,g) => s + g.matriculados,0)]],
    }],
  };
}
