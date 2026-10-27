// Restricciones del formulario de nuevo ingreso adjunto; validadores compartidos.
import { normalizarTexto, errorNombre, errorTelefono, errorCorreo, errorFecha, errorTextoDescriptivo, errorFoto, errorNacimientoEstudiante, limiteNacimientoEstudiante } from '../Nuevo_ingreso/validaciones.mjs?v=7';
import { TELEFONOS_SV } from '../Nuevo_ingreso/telefonos-sv.js?v=2';
import { validarLugarNacimiento } from '../Nuevo_ingreso/buscador-nacimiento.js';
import { territorioSV } from '../Nuevo_ingreso/territorio-sv.mjs';
const lugaresElSalvador = territorioSV.map(l => l.distrito + ' - ' + l.municipio);
import { desactivarEdicion as cerrarEdicion, limpiarErrores, marcarErrorCampo, normalizarEspecialidad } from '../validacion-matricula.js';
const REGLAS = {
  paisNacimiento: { tipo: "text", req: true, max: 80, lista: 'AF AL DE AD AO AG SA DZ AR AM AU AT AZ BS BD BB BH BE BZ BJ BY BO BA BW BR BN BG BF BI BT CV KH CM CA QA TD CL CN CY CO KM CG CD KP KR CR CI HR CU DK DM EC EG SV AE ER SK SI ES US EE SZ ET PH FI FJ FR GA GM GE GH GD GR GT GN GW GQ GY HT HN HU IN ID IQ IR IE IS IL IT JM JP JO KZ KE KG KI KW LA LS LV LB LR LY LI LT LU MK MG MY MW MV ML MT MA MH MU MR MX FM MD MC MN ME MZ MM NA NR NP NI NE NG NO NZ OM NL PK PW PA PG PY PE PL PT GB CF CZ DO RO RW RU SB WS KN SM VC LC ST SN RS SC SL SG SY SO LK ZA SD SS SE CH SR TH TZ TJ TL TG TO TT TN TM TR TV UA UG UY UZ VU VA VE VN YE DJ ZM ZW PS'.split(' ').map(c => new Intl.DisplayNames(['es'],{type:'region'}).of(c)).sort((a,b)=>a.localeCompare(b,'es')) },
  tipoModalidad: { tipo: "text", req: true, lista: ["Modalidad Regular", "Modalidad Alterna (Sábados)"] },
  "nie": {
    "tipo": "text",
    "req": true,
    "max": 12,
    "patron": "[0-9]{7,12}"
  },
  "duiEstudiante": {
    "tipo": "text",
    "req": false,
    "max": 10,
    "patron": "[0-9]{8}-[0-9]"
  },
  "primerApellido": {
    "tipo": "text",
    "req": true,
    "max": 12,
    "patron": "[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+"
  },
  "segundoApellido": {
    "tipo": "text",
    "req": true,
    "max": 12,
    "patron": "[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+"
  },
  "primerNombre": {
    "tipo": "text",
    "req": true,
    "max": 12,
    "patron": "[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+"
  },
  "segundoNombre": {
    "tipo": "text",
    "req": true,
    "max": 12,
    "patron": "[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+"
  },
  "lugarNacimiento": {
    "tipo": "text",
    "req": true
  },
  "fechaNacimiento": {
    "tipo": "date",
    "req": true
  },
  "edad": {
    "tipo": "number",
    "req": false
  },
  "grado": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Primer Año",
      "Segundo Año",
      "Tercer Año"
    ],
    "etiquetas": {
      "Primer Año": "Primer Año",
      "Segundo Año": "Segundo Año",
      "Tercer Año": "Tercer Año"
    }
  },
  "sexo": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Femenino",
      "Masculino"
    ],
    "etiquetas": {
      "Femenino": "Femenino",
      "Masculino": "Masculino"
    }
  },
  "telefonoEstudiante": {
    "tipo": "tel",
    "req": true,
    "max": 9,
    "patron": "[25678][0-9]{3}-?[0-9]{4}"
  },
  "correoEstudiantil": {
    "tipo": "email",
    "req": true,
    "patron": "[0-9]+@clases\\.edu\\.sv"
  },
  "correoPersonal": {
    "tipo": "email",
    "req": true,
    "max": 35,
    "patron": "[a-z0-9]+@[a-z0-9]+\\.[a-z]{2,}"
  },
  "especialidad": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Bachillerato General",
      "Administrativo Contable",
      "Bachillerato técnico vocacional en Gestión Organizacional (Primeros años)",
      "Servicios Turísticos",
      "Desarrollo de Software"
    ],
    "etiquetas": {
      "Bachillerato General": "Bachillerato General",
      "Administrativo Contable": "Bachilerato Técnico Vocaional en Gestión Organizacional (Administrativo Contable)",
      "Bachillerato técnico vocacional en Gestión Organizacional (Primeros años)": "Bachillerato técnico vocacional en Gestión Organizacional (Primeros años)",
      "Servicios Turísticos": "Bachillerato Técnico Vocacional en Servicios Turísticos",
      "Desarrollo de Software": "Bachillerato Técnico Vocacional en Desarrollo de Software y Servicios Digitales"
    }
  },
  "ultimoAnioAprobado": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Noveno Grado",
      "Primer Año",
      "Segundo Año"
    ],
    "etiquetas": {
      "Noveno Grado": "Noveno Grado",
      "Primer Año": "Primer Año",
      "Segundo Año": "Segundo Año"
    }
  },
  "colegioAnterior": {
    "tipo": "text",
    "req": true
  },
  "tipoIngreso": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Nuevo ingreso",
      "Antiguo ingreso"
    ],
    "etiquetas": {
      "Nuevo ingreso": "Nuevo ingreso",
      "Antiguo ingreso": "Antiguo ingreso"
    }
  },
  "hermanosCentroeducativo": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Sí",
      "No"
    ],
    "etiquetas": {
      "Sí": "Sí",
      "No": "No"
    }
  },
  "computadoraMineducyt": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Sí",
      "No"
    ],
    "etiquetas": {
      "Sí": "Sí",
      "No": "No"
    }
  },
  "internet": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Sí",
      "No"
    ],
    "etiquetas": {
      "Sí": "Sí",
      "No": "No"
    }
  },
  "tallaCamisa": {
    "tipo": "text",
    "req": true,
    "lista": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "etiquetas": {
      "XS": "XS",
      "S": "S",
      "M": "M",
      "L": "L",
      "XL": "XL"
    }
  },
  "tallaPantalon": {
    "tipo": "text",
    "req": true,
    "lista": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "etiquetas": {
      "XS": "XS",
      "S": "S",
      "M": "M",
      "L": "L",
      "XL": "XL"
    }
  },
  "tallaBlusa": {
    "tipo": "text",
    "req": true,
    "lista": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "etiquetas": {
      "XS": "XS",
      "S": "S",
      "M": "M",
      "L": "L",
      "XL": "XL"
    }
  },
  "tallaFalda": {
    "tipo": "text",
    "req": true,
    "lista": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "etiquetas": {
      "XS": "XS",
      "S": "S",
      "M": "M",
      "L": "L",
      "XL": "XL"
    }
  },
  "tallaZapatos": {
    "tipo": "text",
    "req": true,
    "lista": [
      "28",
      "29",
      "30",
      "31",
      "32",
      "33",
      "34",
      "35",
      "36",
      "37",
      "38",
      "39",
      "40",
      "41",
      "42",
      "43",
      "44",
      "45"
    ],
    "etiquetas": {
      "28": "28",
      "29": "29",
      "30": "30",
      "31": "31",
      "32": "32",
      "33": "33",
      "34": "34",
      "35": "35",
      "36": "36",
      "37": "37",
      "38": "38",
      "39": "39",
      "40": "40",
      "41": "41",
      "42": "42",
      "43": "43",
      "44": "44",
      "45": "45"
    }
  },
  "tipoTransporte": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Peatonal",
      "Público",
      "Privado",
      "Microbús"
    ],
    "etiquetas": {
      "Peatonal": "Peatonal",
      "Público": "Público",
      "Privado": "Privado",
      "Microbús": "Microbús"
    }
  },
  "distanciaKm": {
    "tipo": "text",
    "req": true,
    "max": 4,
    "patron": "[0-9]{1,3}(\\.[0-9]{1,2})?"
  },
  "zonaResidencia": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Urbana",
      "Rural"
    ],
    "etiquetas": {
      "Urbana": "Urbana",
      "Rural": "Rural"
    }
  },
  "conQuienVive": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Madre",
      "Padre",
      "Ambos",
      "Tío/a",
      "Abuelo/a",
      "Otros"
    ],
    "etiquetas": {
      "Madre": "Madre",
      "Padre": "Padre",
      "Ambos": "Ambos",
      "Tío/a": "Tío/a",
      "Abuelo/a": "Abuelo/a",
      "Otros": "Otros"
    }
  },
  "conQuienViveOtro": {
    "tipo": "text",
    "max": 50
  },
  "direccionResidencia": {
    "tipo": "text",
    "req": true,
    "max": 70,
    "patron": "[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ.,#°\\-\\s]+"
  },
  "enfermedad": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Sí",
      "No"
    ],
    "etiquetas": {
      "Sí": "Sí",
      "No": "No"
    }
  },
  "responsable": {
    "tipo": "text",
    "req": true,
    "max": 50,
    "patron": "[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+"
  },
  "parentesco": {
    "tipo": "text",
    "req": true,
    "lista": [
      "Mamá",
      "Papá",
      "Tío",
      "Tía",
      "Abuelo",
      "Abuela",
      "Madrina",
      "Padrino",
      "Otros"
    ],
    "etiquetas": {
      "Mamá": "Mamá",
      "Papá": "Papá",
      "Tío": "Tío",
      "Tía": "Tía",
      "Abuelo": "Abuelo",
      "Abuela": "Abuela",
      "Madrina": "Madrina",
      "Padrino": "Padrino",
      "Otros": "Otros"
    }
  },
  "duiResponsable": {
    "tipo": "text",
    "req": true,
    "max": 10,
    "patron": "[0-9]{8}-[0-9]"
  },
  "telefonoResponsable": {
    "tipo": "tel",
    "req": true,
    "max": 9,
    "patron": "[25678][0-9]{3}-?[0-9]{4}"
  },
  "whatsappResponsable": {
    "tipo": "tel",
    "req": false,
    "max": 9,
    "patron": "[5678][0-9]{3}-?[0-9]{4}"
  },
  "correoResponsable": {
    "tipo": "email",
    "req": true,
    "patron": "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}"
  },
  "madreNombre": {
    "tipo": "text",
    "req": true,
    "max": 50,
    "patron": "[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+"
  },
  "madreOcupacion": {
    "tipo": "text",
    "req": true,
    "max": 150
  },
  "madreLugarTrabajo": {
    "tipo": "text",
    "req": true,
    "max": 40
  },
  "madreDui": {
    "tipo": "tel",
    "req": true,
    "max": 10,
    "patron": "[0-9]{8}-[0-9]"
  },
  "madreCelular": {
    "tipo": "tel",
    "req": true,
    "max": 9,
    "patron": "[5678][0-9]{3}-?[0-9]{4}"
  },
  "padreNombre": {
    "tipo": "text",
    "req": true,
    "max": 50,
    "patron": "[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+"
  },
  "padreOcupacion": {
    "tipo": "text",
    "req": true,
    "max": 150
  },
  "padreLugarTrabajo": {
    "tipo": "text",
    "req": true,
    "max": 40
  },
  "padreDui": {
    "tipo": "tel",
    "req": true,
    "max": 10,
    "patron": "[0-9]{8}-[0-9]"
  },
  "padreCelular": {
    "tipo": "tel",
    "req": true,
    "max": 9,
    "patron": "[5678][0-9]{3}-?[0-9]{4}"
  },
  "numeroFicha": {
    "tipo": "text",
    "req": false
  },
  "nombresHermanos": {
    "tipo": "text",
    "max": 420
  },
  "nivelAcademico": {
    "tipo": "text",
    "max": 100
  },
  "cualEnfermedad": {
    "tipo": "text",
    "max": 500
  },
  "medicamento": {
    "tipo": "text",
    "max": 500
  },
  "otros": {
    "tipo": "text",
    "max": 500
  },
  "madreFechaNacimiento": {
    "tipo": "date"
  },
  "padreFechaNacimiento": {
    "tipo": "date"
  }
};
// El script de nuevo ingreso amplía estos patrones al iniciar.
const CAMPOS_NOMBRE = ['primerNombre','segundoNombre','primerApellido','segundoApellido','responsable','madreNombre','padreNombre'];
for (const k of CAMPOS_NOMBRE) REGLAS[k].patron = "[\\p{L} '\u2019\\-]+";
const partesLista = v => v.split(/[,;\n]+/).map(v=>v.trim()).filter(Boolean);
const campo = (cont, k) => cont.querySelector('#r_' + k);
const valor = (cont, k) => campo(cont,k)?.value.trim() || '';
const automaticos = ['numeroFicha','fechaMatricula','edad','correoEstudiantil'];
export function desactivarEdicion(cont) {
 cerrarEdicion(cont);
 const foto = cont.querySelector('#editarFotoAdministrador');
 if (foto) { foto.hidden = true; foto.querySelector('input').value = ''; }
}
function edadActual(fecha) {
 if (errorFecha(fecha)) return '';
 const f = new Date(fecha+'T00:00:00'), h = new Date();
 return h.getFullYear()-f.getFullYear() - (h.getMonth()<f.getMonth() || (h.getMonth()===f.getMonth() && h.getDate()<f.getDate()) ? 1 : 0);
}
function dependencias(cont) {
 const set = (k,v) => { if(campo(cont,k)) campo(cont,k).value=v; };
 set('edad',edadActual(valor(cont,'fechaNacimiento')));
 set('correoEstudiantil',valor(cont,'nie') ? valor(cont,'nie')+'@clases.edu.sv' : '');
 const bloquear = (k,si) => {
  const el=campo(cont,k); if(!el)return;
  el.readOnly=si; el.classList.toggle('campo-bloqueado',si);
  const select=cont.querySelector('select[data-para-input="'+el.id+'"]');
  if(select)select.disabled=si;
  if(si){el.value='';if(select)select.value='';}
 };
 ['nombresHermanos','nivelAcademico'].forEach(k=>bloquear(k,valor(cont,'hermanosCentroeducativo')!=='Sí'));
 ['cualEnfermedad','medicamento','otros'].forEach(k=>bloquear(k,valor(cont,'enfermedad')!=='Sí'));
 ['tallaCamisa','tallaPantalon'].forEach(k=>bloquear(k,valor(cont,'sexo')!=='Masculino'));
 ['tallaBlusa','tallaFalda'].forEach(k=>bloquear(k,valor(cont,'sexo')!=='Femenino'));
 bloquear('conQuienViveOtro',valor(cont,'conQuienVive')!=='Otros');
 const general=cont.querySelector('select[data-para-input="r_especialidad"] option[value="Bachillerato General"]');
 if(general)general.disabled=valor(cont,'grado')==='Tercer Año';
}
function normalizar(el,k) {
 let v=el.value;
 if(CAMPOS_NOMBRE.includes(k))v=v.replace(/\p{N}/gu,'').toLowerCase().split(' ').map(p=>p ? p[0].toUpperCase()+p.slice(1):p).join(' ');
 else if(k==='nie')v=v.replace(/\D/g,'').slice(0,12);
 else if(TELEFONOS_SV[k]){const d=v.replace(/\D/g,'').slice(0,8);v=d.length>4?d.slice(0,4)+'-'+d.slice(4):d;}
 else if(/^(duiEstudiante|duiResponsable|madreDui|padreDui)$/.test(k)){const d=v.replace(/\D/g,'').slice(0,9);v=d.length>8?d.slice(0,8)+'-'+d.slice(8):d;}
 else if(REGLAS[k]?.tipo==='email')v=v.toLowerCase().replace(/\s/g,'');
 else if(k==='distanciaKm'){
 const partes=v.replace(/[^0-9.]/g,'').split('.'), entero=partes.shift().slice(0,3);
 v=entero+(partes.length?'.'+partes.join('').slice(0,3-entero.length):'');
 }
 el.value=v;
}
export function activarEdicion(cont) {
 cerrarEdicion(cont);cont.dataset.edicion='1';
 cont.querySelector('#editarFotoAdministrador').hidden = false;
 for(const el of cont.querySelectorAll('input[id^="r_"]')) {
  const k=el.id.slice(2), regla=REGLAS[k];
  el.readOnly=automaticos.includes(k);
  el.classList.toggle('campo-bloqueado',el.readOnly);
  if(!regla)continue;
  if(regla.max)el.maxLength=regla.max;
  if(regla.tipo==='date') {el.type='date';const h=new Date();el.max=k==='fechaNacimiento' ? limiteNacimientoEstudiante(h) : new Date(h-h.getTimezoneOffset()*60000).toISOString().slice(0,10);}
  if(regla.lista){
   const select=document.createElement('select');select.className='select-edicion';select.dataset.paraInput=el.id;
   select.add(new Option('Seleccione…',''));
   regla.lista.forEach(v=>select.add(new Option(regla.etiquetas?.[v] || v,v)));
   const actual=k==='especialidad' ? (regla.lista.includes(el.value) ? el.value : regla.lista.find(v=>normalizarEspecialidad(v)===normalizarEspecialidad(el.value)) || el.value) : el.value;
   if(actual && !regla.lista.includes(actual)) select.add(new Option(actual+' (valor anterior)',actual));
   select.value=actual;el.value=actual;el.style.display='none';el.after(select);
   select.addEventListener('change',()=>{el.value=select.value;el.dispatchEvent(new Event('input',{bubbles:true}));});
  }
 }
 const lugar=campo(cont,'lugarNacimiento');
 if(lugar){
  let lista=document.getElementById('lugaresNacimientoAdmin');
  if(!lista){lista=document.createElement('datalist');lista.id='lugaresNacimientoAdmin';lugaresElSalvador.forEach(v=>lista.appendChild(new Option(v,v)));cont.appendChild(lista);}
  lugar.setAttribute('list',lista.id);
 }
 if(!cont._reglasFormulario){
  cont.addEventListener('beforeinput', e => {
    if(cont.dataset.edicion!=='1' || !e.target.id.startsWith('r_') || !e.data)return;
    const k=e.target.id.slice(2);
    if(CAMPOS_NOMBRE.includes(k) && /[^\p{L}\p{M} '’\-]/u.test(e.data))e.preventDefault();
    if(k==='nie' && /[^0-9]/u.test(e.data))e.preventDefault();
  });
  cont.addEventListener('focusout',e=>{
    if(cont.dataset.edicion!=='1'||!e.target.id.startsWith('r_'))return;
    const el=e.target, k=el.id.slice(2);
    if(automaticos.includes(k))return;
    const datos=Object.fromEntries(Array.from(cont.querySelectorAll('input[id^="r_"]'),i=>[i.id.slice(2),i.value.trim()]));
    const msg=errorCampo(k,el.value.trim(),datos);
    if(msg)marcarErrorCampo(cont,k,msg);
  });
  cont.addEventListener('input',e=>{
   if(cont.dataset.edicion!=='1'||!e.target.id.startsWith('r_'))return;
   const k=e.target.id.slice(2);
   normalizar(e.target,k);
   if(['parentesco','responsable','duiResponsable','telefonoResponsable','whatsappResponsable'].includes(k)) {
    const prefijo=valor(cont,'parentesco')==='Mamá'?'madre':valor(cont,'parentesco')==='Papá'?'padre':'';
    if(prefijo){
      campo(cont,prefijo+'Nombre').value=valor(cont,'responsable');
      campo(cont,prefijo+'Dui').value=valor(cont,'duiResponsable');
      campo(cont,prefijo+'Celular').value=[valor(cont,'telefonoResponsable'),valor(cont,'whatsappResponsable')].find(v=>v&&!errorTelefono(v,true)) || '';
    }
   }
   dependencias(cont);
   limpiarErrores(cont);
  });cont._reglasFormulario=true;
 }
 dependencias(cont);
}
export function errorCampo(k,v,datos) {
 const regla=REGLAS[k]||{};
 const sexo=datos.sexo;
 if(['tallaCamisa','tallaPantalon'].includes(k)&&sexo!=='Masculino' || ['tallaBlusa','tallaFalda'].includes(k)&&sexo!=='Femenino')return '';
 if(['nombresHermanos','nivelAcademico'].includes(k)&&datos.hermanosCentroeducativo!=='Sí')return '';
 if(['cualEnfermedad','medicamento','otros'].includes(k)&&datos.enfermedad!=='Sí')return '';
 if(k==='conQuienViveOtro'&&datos.conQuienVive!=='Otros')return '';
 const req=regla.req || k==='duiEstudiante'&&Number(datos.edad)>=18 || k==='nombresHermanos'&&datos.hermanosCentroeducativo==='Sí' || k==='cualEnfermedad'&&datos.enfermedad==='Sí' || k==='conQuienViveOtro'&&datos.conQuienVive==='Otros';
 if(!v)return req?'Este campo es obligatorio.':'';
 if(regla.max && v.length>regla.max)return 'Máximo '+regla.max+' caracteres.';
 if(k==='nie' && (!/^\d{7,12}$/.test(v)||/^0+$/.test(v)))return 'Ingrese un NIE entre 7 y 12 dígitos, distinto de cero.';
 if(k==='nombresHermanos') {
  const nombres=partesLista(v);
  if(nombres.length>3)return 'Puede registrar hasta 3 hermanos, separados por punto y coma.';
  for(const nombre of nombres){const error=errorNombre(nombre.split(/\s[—–]\s/)[0],50);if(error)return error;}
 }
 if(k==='nivelAcademico') {
  const grados=partesLista(v);
  if(grados.length>3 || grados.length!==partesLista(datos.nombresHermanos||'').length || grados.some(g=>!['Primer Año','Segundo Año','Tercer Año'].includes(g)))return 'Indique un grado válido por cada hermano, separados por punto y coma.';
 }
 if(['cualEnfermedad','medicamento','otros'].includes(k)) {
  const items=v.split(/[;\n]+/).map(v=>v.trim()).filter(Boolean), maximo=k==='otros'?100:60;
  if(items.length>3 || items.some(item=>item.length>maximo))return 'Máximo 3 condiciones; cada dato admite '+maximo+' caracteres.';
 }
 if(regla.patron&&!new RegExp('^(?:'+regla.patron+')$','u').test(v))return 'Revise el formato del campo.';
 if(['primerNombre','segundoNombre','primerApellido','segundoApellido','responsable','madreNombre','padreNombre'].includes(k))return errorNombre(v,regla.max||50);
 if(TELEFONOS_SV[k])return errorTelefono(v,TELEFONOS_SV[k].celular);
 if(k==='correoResponsable'&&v.split('@')[0].length>15)return 'Use máximo 15 caracteres antes de @; el dominio no cuenta.';
 if(regla.tipo==='email'&&k!=='correoEstudiantil')return errorCorreo(v);
 if(k==='fechaNacimiento')return errorNacimientoEstudiante(v);
 if(regla.tipo==='date')return errorFecha(v);
 if(k==='lugarNacimiento')return datos.paisNacimiento && datos.paisNacimiento!=='El Salvador' ? errorTextoDescriptivo(v,{maximo:150}) : validarLugarNacimiento({value:v});
 if(k==='direccionResidencia')return errorTextoDescriptivo(v,{direccion:true,maximo:70});
 if(['madreOcupacion','padreOcupacion','madreLugarTrabajo','padreLugarTrabajo','colegioAnterior'].includes(k))return errorTextoDescriptivo(v);
 if(/^(duiEstudiante|duiResponsable|madreDui|padreDui)$/.test(k)){
  if(!/^\d{8}-\d$/.test(v)||/^(\d)\1{7}-\1$/.test(v))return 'Ingrese un DUI válido con formato 00000000-0, sin todos los dígitos iguales.';
  if((k==='madreDui'||k==='padreDui')&&v===datos[k==='madreDui'?'padreDui':'madreDui'])return 'El DUI del padre y de la madre no puede ser el mismo.';
 }
 if(k==='especialidad'&&datos.grado==='Tercer Año'&&v==='Bachillerato General')return 'Bachillerato General no está disponible para Tercer Año.';
 if(k==='distanciaKm'&&(!/^\d{1,3}(\.\d{1,2})?$/.test(v)||v.replace('.','').length>3))return 'Use máximo 3 números con un decimal opcional.';
 if(regla.lista&&!regla.lista.includes(v))return 'Seleccione una opción válida de la lista.';
 if(/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(v))return 'No use etiquetas HTML ni caracteres de control.';
 return '';
}
export function validarMatricula(cont) {
 limpiarErrores(cont);dependencias(cont);
 const datos=Object.fromEntries(Array.from(cont.querySelectorAll('input[id^="r_"]'),el=>[el.id.slice(2),normalizarTexto(el.value)]));
 const errores={};
 for(const [k,v] of Object.entries(datos)){
  if(automaticos.includes(k))continue;
  const msg=errorCampo(k,v,datos);if(msg)errores[k]=msg;
 }
 const limites={'Primer Año':[14,18],'Segundo Año':[15],'Tercer Año':[17]};
 const limite=limites[datos.grado];
 if(limite && datos.edad!=='' && (+datos.edad<limite[0]||limite[1]&&+datos.edad>limite[1]))errores.fechaNacimiento='La edad no está permitida para '+datos.grado+'.';
 Object.entries(errores).forEach(([k,msg])=>marcarErrorCampo(cont,k,msg));
 const primero=Object.keys(errores)[0];if(primero){const el=campo(cont,primero);el?.scrollIntoView({block:'center'});(cont.querySelector('select[data-para-input="'+el.id+'"]')||el)?.focus();}
 return errores;
}
export async function leerFotoAdministrador(cont, fotoActual) {
 const input=cont.querySelector('#fotoAdministrador');
 const archivo=input.files[0];
 if(!archivo) { if(!fotoActual) throw new Error('La fotografía es obligatoria.'); return null; }
 const error=errorFoto(archivo);if(error)throw new Error(error);
 const base64=await new Promise((resolve,reject)=>{const lector=new FileReader();lector.onload=()=>resolve(lector.result);lector.onerror=()=>reject(new Error('No se pudo leer la fotografía.'));lector.readAsDataURL(archivo);});
 await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=()=>reject(new Error('El archivo no contiene una imagen válida.'));img.src=base64;});
 return base64;
}
