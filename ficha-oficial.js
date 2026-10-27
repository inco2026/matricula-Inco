const escapar = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function fecha(valor) {
 const s=String(valor || '');const iso=/^(\d{4})-(\d{2})-(\d{2})/.exec(s), local=/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(s);
 return iso ? [iso[3],MESES[Number(iso[2])-1],iso[1]] : local ? [local[1],MESES[Number(local[2])-1],local[3]] : ['','',''];
}
const escudo = new URL('./img/Escudo-inco.png', import.meta.url).href;
export function mostrarFichaOficial(contenedor, datos = {}) {
 if(!contenedor)return;
 const v=clave=>escapar(datos[clave]);
 const campo=(titulo,valor)=>'<span class="fo-campo"><span>'+escapar(titulo)+'</span> <b>'+escapar(valor)+'</b></span>';
 const fila=(...campos)=>'<div class="fo-renglon">'+campos.join('')+'</div>';
 const seccion=titulo=>'<h2 class="fo-banda">'+titulo+'</h2>';
 const nacimiento=fecha(datos.fechaNacimiento),matricula=fecha(datos.fechaMatricula);
 const nombre=[datos.primerNombre,datos.segundoNombre,datos.primerApellido,datos.segundoApellido].filter(Boolean).join(' ');
 const foto=/^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(datos.fotoEstudiante || '') ? '<img src="'+datos.fotoEstudiante+'" alt="Fotografía del estudiante">' : 'Foto de<br>3.5 × 2.5 cm';
 const padre=(prefijo,titulo)=>'<div class="fo-progenitor"><b class="fo-nombre-padre">'+v(prefijo+'Nombre')+'</b><div class="fo-parentesco">'+titulo+'</div>'+fila(campo('DUI:',datos[prefijo+'Dui']),campo('Celular:',datos[prefijo+'Celular']))+fila(campo('Ocupación:',datos[prefijo+'Ocupacion']))+fila(campo('Trabajo:',datos[prefijo+'LugarTrabajo']))+(datos[prefijo+'Correo']?fila(campo('Correo:',datos[prefijo+'Correo'])):'')+'</div>';
 const compromisos=['Asistir puntualmente a las convocatorias hechas por la Institución.','Leer y dar cumplimiento a lo establecido en el Manual de Convivencia.','Cumplir con los compromisos pactados en Asamblea General de padres, madres y/o responsables.','Asistir a cualquier llamado del/la maestro/a, coordinación, subdirección o dirección de la institución.','Responder por los daños materiales que ocasione el estudiante en la Institución.','Velar porque el alumno/a no pueda retirarse de la institución en horas de clase, sin la presencia de su responsable.','No permitir que el alumno/a traiga objetos de valor que no sean material didáctico utilizado en clases.'];
 contenedor.innerHTML='<article class="ficha-oficial fo-carta">'+
 '<header class="fo-encabezado"><img class="fo-escudo" src="'+escudo+'" alt="Escudo INCO"><div><strong>MINISTERIO DE EDUCACIÓN</strong><p>Gerencia de Gestión Institucional</p><h1>FICHA DE MATRÍCULA OFICIAL DEL ALUMNO/A</h1><strong>INSTITUTO NACIONAL DE COMERCIO</strong></div><div class="fo-retrato">'+foto+'</div></header>'+
 '<div class="fo-metadatos"><div>San Salvador, <b>'+escapar(matricula[0])+'</b> de <b>'+escapar(matricula[1])+'</b> de <b>'+escapar(matricula[2])+'</b></div><div class="fo-ficha-numero">N.º de ficha<br><b>'+v('numeroFicha')+'</b></div></div>'+
 '<div class="fo-marco">'+seccion('REGISTRO Y DATOS DE IDENTIFICACIÓN')+
 fila(campo('Bachillerato que estudiará:',datos.especialidad),campo('NIE:',datos.nie))+
 fila(campo('Año que estudiará:',datos.grado),campo('DUI del estudiante:',datos.duiEstudiante))+
 fila(campo('Tipo de ingreso:',datos.tipoIngreso),campo('Modalidad:',datos.tipoModalidad))+
 seccion('1. DATOS GENERALES DEL ESTUDIANTE')+
 '<div class="fo-nombres">'+[['primerApellido','Primer apellido'],['segundoApellido','Segundo apellido'],['primerNombre','Primer nombre'],['segundoNombre','Segundo nombre']].map(([k,t])=>'<div><b>'+v(k)+'</b><span>'+t+'</span></div>').join('')+'</div>'+
 fila(campo('Lugar de nacimiento:',[datos.lugarNacimiento,datos.paisNacimiento].filter(Boolean).join(' · ')),campo('Fecha:',nacimiento.filter(Boolean).join(' / ')))+
 fila(campo('Edad:',datos.edad),campo('Sexo:',datos.sexo),campo('Celular:',datos.telefonoEstudiante),campo('Grado:',datos.grado))+
 fila(campo('Último año aprobado:',datos.ultimoAnioAprobado),campo('Centro educativo anterior:',datos.colegioAnterior))+
 fila(campo('Transporte:',datos.tipoTransporte),campo('Distancia (km):',datos.distanciaKm),campo('Zona:',datos.zonaResidencia))+
 fila(campo('Dirección exacta de residencia:',datos.direccionResidencia))+
 fila(campo('¿Con quién vive?',datos.conQuienVive),campo('¿Padece alguna enfermedad?',datos.enfermedad),campo('¿Cuál?',datos.cualEnfermedad))+
 ((datos.medicamento||datos.otros)?fila(campo('Medicamentos:',datos.medicamento),campo('Observaciones de salud:',datos.otros)):'')+
 fila(campo('Correo MINEDUCYT:',datos.correoEstudiantil),campo('Computadora MINEDUCYT:',datos.computadoraMineducyt))+
 fila(campo('Correo personal:',datos.correoPersonal),campo('Acceso a internet:',datos.internet))+
 fila(campo('Tallas — Camisa:',datos.tallaCamisa),campo('Pantalón:',datos.tallaPantalon),campo('Blusa:',datos.tallaBlusa),campo('Falda:',datos.tallaFalda),campo('Zapatos:',datos.tallaZapatos))+
 fila(campo('Hermanos en el centro:',datos.hermanosCentroeducativo),campo('Nombre, grado y NIE:',datos.nombresHermanos))+
 seccion('2. DATOS DEL RESPONSABLE')+
 fila(campo('Responsable:',datos.responsable),campo('DUI:',datos.duiResponsable),campo('Parentesco:',datos.parentesco))+
 fila(campo('Teléfono:',datos.telefonoResponsable),campo('WhatsApp:',datos.whatsappResponsable),campo('Correo:',datos.correoResponsable))+
 '<p class="fo-nota">El correo del responsable permite mantener la comunicación y el control de asistencia.</p>'+
 seccion('3. DATOS DE MADRE Y PADRE')+'<div class="fo-padres">'+padre('madre','MADRE')+padre('padre','PADRE')+'</div>'+
 seccion('4. COMPROMISOS')+'<ol class="fo-compromisos-nuevos">'+compromisos.map(t=>'<li>'+t+'</li>').join('')+'</ol>'+
 seccion('5. ACEPTACIÓN Y AUTORIZACIÓN')+'<div class="fo-firmas-nuevas">'+[[datos.docenteNombre,'DOCENTE'],[datos.responsable,'PADRE, MADRE Y/O RESPONSABLE'],[nombre,'ESTUDIANTE']].map(([n,t])=>'<div class="fo-firma"><div class="fo-linea-firma">F.</div><span class="fo-nombre-firma">'+escapar(n)+'</span><span>'+t+'</span></div>').join('')+'</div></div></article>';
}

export async function imprimirFichaOficial(contenedor) {
 document.getElementById('marcoImpresionFicha')?.remove();
 const marco=document.createElement('iframe');marco.id='marcoImpresionFicha';marco.title='Ficha de matrícula en tamaño carta';
 marco.style.cssText='position:fixed;left:-10000px;top:0;width:816px;height:1056px;border:0';
 const css=new URL('./ficha-oficial.css',import.meta.url).href;
 const listo=new Promise(resolve=>marco.onload=resolve);
 marco.srcdoc='<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ficha de matrícula</title><link rel="stylesheet" href="'+css+'"></head><body>'+contenedor.innerHTML+'</body></html>';
 document.body.appendChild(marco);await listo;
 await Promise.all([...marco.contentDocument.images].map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=r;img.onerror=r;})));
 await marco.contentDocument.fonts.ready;
 marco.contentWindow.addEventListener('afterprint',()=>marco.remove(),{once:true});
 marco.contentWindow.focus();marco.contentWindow.print();
}
