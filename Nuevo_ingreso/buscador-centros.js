const normalizar = valor => valor.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
let centros = [];
const nombres = new Set();
export function esCentroCatalogado(valor) { return nombres.has(normalizar(valor)); }
export function iniciarBuscadorCentros() {
  const input = document.getElementById('colegioAnterior');
  if (!input) return;
  const lista = document.createElement('div');
  lista.id = 'catalogoCentrosEducativos';
  lista.className = 'resultados-centros';
  lista.setAttribute('role', 'listbox');
  lista.hidden = true;
  input.removeAttribute('list');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', lista.id);
  input.setAttribute('aria-expanded', 'false');
  input.placeholder = 'Busque su centro educativo o escriba el nombre';
  const ayuda = document.createElement('small');
  ayuda.id = 'ayudaCentroEducativo';
  ayuda.className = 'ayuda-campo nombre-centro-completo';
  ayuda.setAttribute('role', 'status');
  input.setAttribute('aria-describedby', ayuda.id);
  input.after(lista, ayuda);
  let cargado = false, fallo = false, indice = -1, resultados = [];
  const cerrar = () => { lista.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); indice = -1; };
  const elegir = centro => {
    input.value = centro.nombre;
    input.dispatchEvent(new Event('input', {bubbles:true}));
    input.dispatchEvent(new Event('change', {bubbles:true}));
    cerrar();
  };
  const actualizar = () => {
    const consulta = normalizar(input.value);
    const palabras = consulta.split(' ').filter(Boolean);
    cerrar(); lista.replaceChildren();
    resultados = consulta.length < 2 ? [] : centros.filter(c => palabras.every(p => c.busqueda.includes(p))).slice(0,30);
    ayuda.textContent = esCentroCatalogado(input.value) ? `Centro seleccionado: ${input.value}`
      : fallo ? 'No se pudo cargar la lista. Puede escribir el nombre completo del centro.'
      : !cargado ? 'Cargando centros. También puede escribir el nombre completo.'
      : consulta.length >= 2 && !resultados.length ? 'No se encontraron resultados. Puede escribir aquí el nombre completo de su centro educativo y continuar.'
      : 'Busque por nombre. Si no encuentra su centro, escriba el nombre completo.';
    resultados.forEach((centro,i) => {
      const opcion = document.createElement('div');
      opcion.id = `centro-opcion-${i}`;
      opcion.setAttribute('role', 'option');
      opcion.setAttribute('aria-selected', 'false');
      const nombre = document.createElement('strong'); nombre.textContent = centro.nombre;
      const lugar = document.createElement('small'); lugar.textContent = `${centro.departamento} · ${centro.distrito} · ${centro.codigo}`;
      opcion.append(nombre,lugar);
      opcion.addEventListener('mousedown', e => e.preventDefault());
      opcion.addEventListener('click', () => elegir(centro));
      lista.append(opcion);
    });
    if (resultados.length && document.activeElement === input) { lista.hidden = false; input.setAttribute('aria-expanded','true'); }
  };
  input.addEventListener('input', actualizar);
  input.addEventListener('focus', actualizar);
  input.addEventListener('blur', cerrar);
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!resultados.length) return;
      e.preventDefault(); lista.hidden = false; input.setAttribute('aria-expanded','true');
      indice = (indice + (e.key === 'ArrowDown' ? 1 : -1) + resultados.length) % resultados.length;
      [...lista.children].forEach((el,i)=>el.setAttribute('aria-selected',String(i === indice)));
      input.setAttribute('aria-activedescendant',lista.children[indice].id);
      lista.children[indice].scrollIntoView({block:'nearest'});
    }
    if (e.key === 'Enter' && !lista.hidden && indice >= 0) { e.preventDefault(); elegir(resultados[indice]); }
  });
  actualizar();
  fetch(new URL('./centros-educativos-sv.json', import.meta.url))
    .then(r => { if (!r.ok) throw Error('Catálogo no disponible'); return r.json(); })
    .then(datos => {
      centros = datos.map(c => ({...c,busqueda:normalizar(`${c.nombre} ${c.departamento} ${c.distrito} ${c.codigo}`)}));
      centros.forEach(c => nombres.add(normalizar(c.nombre)));
      cargado = true; actualizar();
    }).catch(() => { fallo = true; actualizar(); });
}
