import { territorioSV } from './territorio-sv.mjs';
const lugaresElSalvador = territorioSV.map(l => `${l.distrito} - ${l.municipio}`);
const lugaresAnteriores = {
  "Ataco - Ahuachapán Centro": "Concepción de Ataco - Ahuachapán Centro",
  "San Francisco Menéndez - Ahuachapán Norte": "San Francisco Menéndez - Ahuachapán Sur",
  "Jujutla - Ahuachapán Norte": "Jujutla - Ahuachapán Sur",
  "Guaymango - Ahuachapán Norte": "Guaymango - Ahuachapán Sur",
  "San Pedro Puxtla - Ahuachapán Norte": "San Pedro Puxtla - Ahuachapán Sur",
  "Atiquizaya - Ahuachapán Sur": "Atiquizaya - Ahuachapán Norte",
  "El Refugio - Ahuachapán Sur": "El Refugio - Ahuachapán Norte",
  "San Lorenzo - Ahuachapán Sur": "San Lorenzo - Ahuachapán Norte",
  "Turín - Ahuachapán Sur": "Turín - Ahuachapán Norte",
  "Santiago de la Frontera - Santa Ana Oeste": "Santiago de La Frontera - Santa Ana Oeste",
  "Nahuizalco - Sonsonate Centro": "Nahuizalco - Sonsonate Norte",
  "Acajutla - Sonsonate Este": "Acajutla - Sonsonate Oeste",
  "Salcoatitán - Sonsonate Este": "Salcoatitán - Sonsonate Norte",
  "Juayúa - Sonsonate Este": "Juayúa - Sonsonate Norte",
  "Santa Catarina Masahuat - Sonsonate Este": "Santa Catarina Masahuat - Sonsonate Norte",
  "Armenia - Sonsonate Norte": "Armenia - Sonsonate Este",
  "Caluco - Sonsonate Norte": "Caluco - Sonsonate Este",
  "Cuisnahuat - Sonsonate Norte": "Cuisnahuat - Sonsonate Este",
  "Izalco - Sonsonate Norte": "Izalco - Sonsonate Este",
  "San Julián - Sonsonate Norte": "San Julián - Sonsonate Este",
  "Santa Isabel Ishuatán - Sonsonate Norte": "Santa Isabel Ishuatán - Sonsonate Este",
  "Santo Domingo de Guzmán - Sonsonate Oeste": "Santo Domingo de Guzmán - Sonsonate Centro",
  "Sonzacate - Sonsonate Oeste": "Sonzacate - Sonsonate Centro",
  "Chalatenango - Chalatenango Centro": "Chalatenango - Chalatenango Sur",
  "Nueva Concepción - Chalatenango Sur": "Nueva Concepción - Chalatenango Centro",
  "San Antonio de la Cruz - Chalatenango Sur": "San Antonio de La Cruz - Chalatenango Sur",
  "Cojutepeque - Cuscatlán Norte": "Cojutepeque - Cuscatlán Sur",
  "Candelaria - Cuscatlán Norte": "Candelaria - Cuscatlán Sur",
  "El Carmen - Cuscatlán Norte": "El Carmen - Cuscatlán Sur",
  "El Rosario - Cuscatlán Norte": "El Rosario - Cuscatlán Sur",
  "Monte San Juan - Cuscatlán Norte": "Monte San Juan - Cuscatlán Sur",
  "San Cristóbal - Cuscatlán Norte": "San Cristóbal - Cuscatlán Sur",
  "San Rafael Cedros - Cuscatlán Norte": "San Rafael Cedros - Cuscatlán Sur",
  "Santa Cruz Analquito - Cuscatlán Norte": "Santa Cruz Analquito - Cuscatlán Sur",
  "Santa Cruz Michapa - Cuscatlán Norte": "Santa Cruz Michapa - Cuscatlán Sur",
  "Tenancingo - Cuscatlán Norte": "Tenancingo - Cuscatlán Sur",
  "Zacatecoluca - La Paz Centro": "Zacatecoluca - La Paz Este",
  "San Juan Nonualco - La Paz Centro": "San Juan Nonualco - La Paz Este",
  "San Rafael Obrajuelo - La Paz Centro": "San Rafael Obrajuelo - La Paz Este",
  "Olocuilta - La Paz Este": "Olocuilta - La Paz Oeste",
  "San Juan Talpa - La Paz Este": "San Juan Talpa - La Paz Oeste",
  "San Luis Talpa - La Paz Este": "San Luis Talpa - La Paz Oeste",
  "San Miguel Tepezontes - La Paz Este": "San Miguel Tepezontes - La Paz Centro",
  "San Francisco Chinameca - La Paz Este": "San Francisco Chinameca - La Paz Oeste",
  "Cuyultitán - La Paz Este": "Cuyultitán - La Paz Oeste",
  "El Rosario - La Paz Este": "El Rosario - La Paz Centro",
  "Jerusalén - La Paz Este": "Jerusalén - La Paz Centro",
  "Paraíso de Osorio - La Paz Este": "Paraíso de Osorio - La Paz Centro",
  "San Antonio Masahuat - La Paz Este": "San Antonio Masahuat - La Paz Centro",
  "San Emigdio - La Paz Este": "San Emigdio - La Paz Centro",
  "San Juan Tepezontes - La Paz Este": "San Juan Tepezontes - La Paz Centro",
  "San Pedro Masahuat - La Paz Este": "San Pedro Masahuat - La Paz Oeste",
  "Tapalhuaca - La Paz Este": "Tapalhuaca - La Paz Oeste",
  "Santiago Nonualco - La Paz Oeste": "Santiago Nonualco - La Paz Centro",
  "San Juan Nonualco - La Paz Oeste": "San Juan Nonualco - La Paz Este",
  "San Rafael Obrajuelo - La Paz Oeste": "San Rafael Obrajuelo - La Paz Este",
  "San Vicente - San Vicente Norte": "San Vicente - San Vicente Sur",
  "Usulután - Usulután Norte": "Usulután - Usulután Este",
  "Santa Elena - Usulután Norte": "Santa Elena - Usulután Este",
  "California - Usulután Norte": "California - Usulután Este",
  "Concepción Batres - Usulután Norte": "Concepción Batres - Usulután Este",
  "Ereguayquín - Usulután Norte": "Ereguayquín - Usulután Este",
  "Jucuarán - Usulután Norte": "Jucuarán - Usulután Este",
  "Ozatlán - Usulután Norte": "Ozatlán - Usulután Este",
  "San Dionisio - Usulután Norte": "San Dionisio - Usulután Este",
  "Santa María - Usulután Norte": "Santa María - Usulután Este",
  "Tecapán - Usulután Norte": "Tecapán - Usulután Este",
  "San Francisco Gotera - Morazán Norte": "San Francisco Gotera - Morazán Sur",
  "Arambala - Morazán Sur": "Arambala - Morazán Norte",
  "Cacaopera - Morazán Sur": "Cacaopera - Morazán Norte",
  "Joateca - Morazán Sur": "Joateca - Morazán Norte",
  "San Isidro - Morazán Sur": "San Isidro - Morazán Norte",
  "La Unión - La Unión Norte": "La Unión - La Unión Sur"
};

export function iniciarBuscadorNacimiento() {
  const input = document.getElementById("lugarNacimiento");
  if (!input) return;
  const departamento = document.getElementById('departamentoNacimiento');
  if (departamento) {
    const departamentos = ['Ahuachapán','Santa Ana','Sonsonate','Chalatenango','La Libertad','San Salvador','Cuscatlán','La Paz','Cabañas','San Vicente','Usulután','San Miguel','Morazán','La Unión'];
    const departamentoDe = lugar => departamentos.find(d => lugar.split(' - ')[1]?.startsWith(d));
    const llenar = (lugares) => {
      input.replaceChildren(new Option('Seleccione el distrito', ''));
      input.options[0].disabled = true;
      for (const lugar of [...new Set(lugares)]) input.add(new Option(lugar, lugar));
      input.value = '';
    };
    departamentos.forEach(d => departamento.add(new Option(d,d)));
    llenar(lugaresElSalvador);
    // Opciones internas solo para recuperar borradores del catálogo anterior.
    Object.keys(lugaresAnteriores).forEach(valor => {
      const opcion = new Option(valor, valor); opcion.disabled = true; opcion.hidden = true; input.add(opcion);
    });
    departamento.addEventListener('change', () => {
      llenar(lugaresElSalvador.filter(l => departamentoDe(l) === departamento.value));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    document.addEventListener('restaurar-nacimiento', () => {
      const lugar = lugaresAnteriores[input.value] || input.value;
      if (lugar) departamento.value = departamentoDe(lugar) || '';
      llenar(lugaresElSalvador.filter(l => departamentoDe(l) === departamento.value));
      input.value = lugar;
    });
    const syncDepartamento = crearBusqueda(departamento, 'Departamento');
    const syncDistrito = crearBusqueda(input, 'Distrito');
    departamento.addEventListener('change', syncDistrito);
    document.addEventListener('restaurar-nacimiento', () => { syncDepartamento(); syncDistrito(); });
    return;
  }

  const contenedor = input.closest('.campo');
  if (!contenedor) return;

  // Aseguramos que el contenedor sea relativo para que la lista flote correctamente
  contenedor.style.position = 'relative';

  // Crear el contenedor de la lista de sugerencias
  let lista = contenedor.querySelector('.lista-sugerencias');
  if (!lista) {
    lista = document.createElement('div');
    lista.className = 'lista-sugerencias';
    
    // --- DISEÑO MEJORADO Y LLAMATIVO ---
    lista.style.position = 'absolute';
    lista.style.top = 'calc(100% + 6px)';
    lista.style.left = '0';
    lista.style.right = '0';
    lista.style.backgroundColor = '#ffffff'; 
    lista.style.border = '2px solid #3b82f6'; // Borde azul llamativo
    lista.style.borderRadius = '10px';
    lista.style.maxHeight = '240px';
    lista.style.overflowY = 'auto';
    lista.style.zIndex = '9999';
    lista.style.display = 'none';
    lista.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)'; // Sombra más pronunciada
    lista.style.marginTop = '2px';
    lista.style.padding = '5px 0'; // Espaciado interno
    
    contenedor.appendChild(lista);
  }

  input.addEventListener("input", function() {
    const valor = this.value.toLowerCase().trim();
    lista.innerHTML = '';

    if (valor.length < 1) {
      lista.style.display = 'none';
      return;
    }

    const filtrados = lugaresElSalvador.filter(lugar =>
      lugar.toLowerCase().includes(valor)
    );

    if (filtrados.length === 0) {
      lista.style.display = 'none';
      return;
    }

    filtrados.forEach(lugar => {
      const item = document.createElement('div');
      item.className = 'item-sugerencia';
      
      // Usamos un emoji de pin para hacerlo más visual
      item.innerHTML = `<span style="margin-right: 8px;">📍</span>${lugar}`;
      
      // --- ESTILOS DEL ITEM LLAMATIVOS ---
      item.style.padding = '12px 16px';
      item.style.cursor = 'pointer';
      item.style.fontSize = '15px';
      item.style.fontWeight = '600'; // Texto en negrita
      item.style.color = '#1e293b'; // Color de texto oscuro y legible
      item.style.backgroundColor = '#ffffff';
      item.style.transition = 'all 0.2s ease';
      item.style.borderBottom = '1px solid #f1f5f9';
      
      // Efecto Hover llamativo (Fondo azul suave, texto azul oscuro)
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#eff6ff';
        item.style.color = '#1d4ed8';
        item.style.paddingLeft = '20px'; // Pequeña animación de desplazamiento
      });
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = '#ffffff';
        item.style.color = '#1e293b';
        item.style.paddingLeft = '16px';
      });

      // Al hacer clic, seleccionamos el lugar
      item.addEventListener('click', () => {
        input.value = lugar;
        lista.style.display = 'none';
        
        // Forzamos la validación para quitar el borde rojo
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true })); 
      });
      
      // Quitar el borde inferior al último elemento
      if (filtrados.indexOf(lugar) === filtrados.length - 1) {
        item.style.borderBottom = 'none';
      }
      
      lista.appendChild(item);
    });

    lista.style.display = 'block';
  });

  // Ocultar lista al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !lista.contains(e.target)) {
      lista.style.display = 'none';
    }
  });
}

export function validarLugarNacimiento(input) {
  const valor = input.value.trim();
  if (!valor) {
    return "El lugar de nacimiento es obligatorio.";
  }
  // Validar que el texto coincida exactamente con uno de la lista
  const existe = lugaresElSalvador.some(lugar => lugar.toLowerCase() === valor.toLowerCase());
  if (!existe) {
    return "Por favor, seleccione un lugar válido de la lista.";
  }
  return ""; // Retorna vacío si es válido
}

// La búsqueda es visual; los valores guardados siguen siendo los del catálogo.
function crearBusqueda(select, titulo) {
  const caja = document.createElement('div');
  caja.className = 'busqueda-lugar';
  const texto = document.createElement('input');
  texto.id = select.id + 'Busqueda';
  texto.dataset.selectOrigen = select.id;
  texto.placeholder = 'Buscar ' + titulo.toLowerCase();
  texto.autocomplete = 'off';
  texto.required = true;
  texto.setAttribute('role', 'combobox');
  texto.setAttribute('aria-autocomplete', 'list');
  texto.setAttribute('aria-expanded', 'false');
  const lista = document.createElement('div');
  lista.id = texto.id + 'Opciones';
  lista.className = 'busqueda-opciones';
  lista.setAttribute('role', 'listbox');
  lista.hidden = true;
  texto.setAttribute('aria-controls', lista.id);
  const etiqueta = document.querySelector(`label[for="${select.id}"]`);
  if (etiqueta) etiqueta.htmlFor = texto.id;
  select.hidden = true;
  select.after(caja);
  caja.append(texto, lista);
  const cerrar = () => { lista.hidden = true; texto.setAttribute('aria-expanded', 'false'); };
  const normalizar = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let indice = -1;
  const elegir = opcion => {
    select.value = opcion.value;
    texto.value = opcion.text;
    select.dispatchEvent(new Event('change', {bubbles:true}));
    texto.dispatchEvent(new Event('change', {bubbles:true}));
    cerrar();
  };
  const mostrar = () => {
    lista.replaceChildren(); indice = -1;
    const opciones = [...select.options].filter(o => o.value && !o.disabled && !o.hidden && normalizar(o.text).includes(normalizar(texto.value)));
    opciones.forEach((opcion, i) => {
      const item = document.createElement('div');
      item.id = lista.id + i; item.setAttribute('role', 'option');
      item.textContent = opcion.text;
      item.addEventListener('mousedown', e => e.preventDefault());
      item.addEventListener('click', () => elegir(opcion));
      lista.append(item);
    });
    if (!opciones.length) { const aviso = document.createElement('p'); aviso.textContent = 'No hay coincidencias. Busque otra opción.'; lista.append(aviso); }
    lista.hidden = false; texto.setAttribute('aria-expanded', 'true');
    texto.onkeydown = e => {
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!opciones.length) return;
        indice = (indice + (e.key === 'ArrowDown' ? 1 : -1) + opciones.length) % opciones.length;
        [...lista.children].forEach((n,i) => n.setAttribute('aria-selected', String(i === indice)));
        texto.setAttribute('aria-activedescendant', lista.children[indice].id);
        lista.children[indice].scrollIntoView({block:'nearest'});
      }
      if (e.key === 'Enter' && !lista.hidden) { e.preventDefault(); if (indice >= 0) elegir(opciones[indice]); }
    };
  };
  texto.addEventListener('input', () => {
    select.value = '';
    select.dispatchEvent(new Event('change', {bubbles:true}));
    mostrar();
  });
  texto.addEventListener('focus', mostrar);
  texto.addEventListener('blur', cerrar);
  const sincronizar = () => { texto.value = select.value ? select.selectedOptions[0].text : ''; cerrar(); };
  select.addEventListener('change', () => { if (select.value) sincronizar(); });
  return sincronizar;
}
