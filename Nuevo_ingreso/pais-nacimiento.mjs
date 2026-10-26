export function iniciarPaisNacimiento() {
  const pais = document.getElementById('paisNacimiento');
  const extranjero = document.getElementById('nacimientoExtranjero');
  const bloqueSV = document.getElementById('nacimientoSV');
  const bloqueExterior = document.getElementById('nacimientoExterior');
  const nombres = new Intl.DisplayNames(['es'], { type: 'region' });
  const codigos = 'AF AL DE AD AO AG SA DZ AR AM AU AT AZ BS BD BB BH BE BZ BJ BY BO BA BW BR BN BG BF BI BT CV KH CM CA QA TD CL CN CY CO KM CG CD KP KR CR CI HR CU DK DM EC EG SV AE ER SK SI ES US EE SZ ET PH FI FJ FR GA GM GE GH GD GR GT GN GW GQ GY HT HN HU IN ID IQ IR IE IS IL IT JM JP JO KZ KE KG KI KW LA LS LV LB LR LY LI LT LU MK MG MY MW MV ML MT MA MH MU MR MX FM MD MC MN ME MZ MM NA NR NP NI NE NG NO NZ OM NL PK PW PA PG PY PE PL PT GB CF CZ DO RO RW RU SB WS KN SM VC LC ST SN RS SC SL SG SY SO LK ZA SD SS SE CH SR TH TZ TJ TL TG TO TT TN TM TR TV UA UG UY UZ VU VA VE VN YE DJ ZM ZW PS'.split(' ');
  codigos.map(codigo => ({codigo, nombre:nombres.of(codigo)})).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es')).forEach(({codigo,nombre})=>pais.add(new Option(nombre,codigo)));
  pais.value = 'SV';
  const actualizar = () => {
    const local = pais.value === 'SV';
    bloqueSV.hidden = !local; bloqueExterior.hidden = local;
    bloqueSV.querySelectorAll('input,select').forEach(el => { el.disabled = !local; });
    extranjero.disabled = local; extranjero.required = !local;
  };
  pais.addEventListener('change', actualizar);
  document.addEventListener('restaurar-nacimiento', actualizar);
  actualizar();
}
export function nacimientoParaGuardar() {
  const pais = document.getElementById('paisNacimiento');
  return pais.value === 'SV' ? document.getElementById('lugarNacimiento').value : `${document.getElementById('nacimientoExtranjero').value.trim()} - ${pais.selectedOptions[0].text}`;
}
