// El PDF se dibuja en tamaño A4: no depende del scroll, CSS ni ancho del dispositivo.
export async function crearComprobantePDF(campos) {
  const { PDFDocument, StandardFonts, rgb } = await import('./vendor/pdf-lib.esm.min.js');
  const documento = await PDFDocument.create();
  const normal = await documento.embedFont(StandardFonts.Helvetica);
  const negrita = await documento.embedFont(StandardFonts.HelveticaBold);
  const verde = rgb(0.11, 0.46, 0.25);
  const tinta = rgb(0.10, 0.16, 0.13);
  const borde = rgb(0.78, 0.86, 0.81);
  const blanco = rgb(1, 1, 1);
  const ancho = 595.28, alto = 841.89;
  const margen = 36, interior = 52;
  const anchoEtiqueta = 155, anchoValor = 310;
  let pagina, y;

  const nuevaPagina = () => {
    pagina = documento.addPage([ancho, alto]);
    pagina.drawRectangle({ x: margen, y: alto - 112, width: ancho - margen * 2, height: 76, color: verde });
    pagina.drawText('Comprobante de matrícula', { x: interior, y: alto - 68, size: 19, font: negrita, color: blanco });
    pagina.drawText('Instituto Nacional de Comercio', { x: interior, y: alto - 92, size: 11, font: normal, color: blanco });
    y = alto - 136;
  };

  function lineas(texto, fuente, tamano, maximo) {
    const resultado = [];
    // Separar también identificadores y correos largos sin espacios.
    for (const parrafo of String(texto).normalize('NFC').split(/\r?\n/u)) {
      let linea = '';
      for (const palabra of parrafo.trim().split(/\s+/u)) {
        if (!palabra) continue;
        const propuesta = linea ? `${linea} ${palabra}` : palabra;
        if (fuente.widthOfTextAtSize(propuesta, tamano) <= maximo) {
          linea = propuesta;
          continue;
        }
        if (linea) { resultado.push(linea); linea = ''; }
        for (const letra of palabra) {
          if (linea && fuente.widthOfTextAtSize(linea + letra, tamano) > maximo) {
            resultado.push(linea);
            linea = '';
          }
          linea += letra;
        }
      }
      resultado.push(linea);
    }
    return resultado;
  }

  nuevaPagina();
  for (const [etiqueta, valor] of campos) {
    if (!String(valor ?? '').trim()) continue;
    const izquierda = lineas(etiqueta, negrita, 10, anchoEtiqueta);
    const derecha = lineas(valor, normal, 11, anchoValor);
    const altoFila = Math.max(izquierda.length, derecha.length) * 15 + 20;
    if (y - altoFila < 58) nuevaPagina();
    izquierda.forEach((linea, i) => pagina.drawText(linea, {
      x: interior, y: y - i * 15, size: 10, font: negrita, color: verde
    }));
    derecha.forEach((linea, i) => pagina.drawText(linea, {
      x: interior + anchoEtiqueta + 16, y: y - i * 15, size: 11, font: normal, color: tinta
    }));
    y -= altoFila;
    pagina.drawLine({ start: { x: interior, y: y + 10 }, end: { x: ancho - interior, y: y + 10 }, thickness: .6, color: borde });
  }
  documento.getPages().forEach((hoja, indice, paginas) => {
    hoja.drawText(`Página ${indice + 1} de ${paginas.length}`, { x: interior, y: 30, size: 9, font: normal, color: verde });
  });
  documento.setTitle('Comprobante de matrícula - Instituto Nacional de Comercio');
  documento.setLanguage('es-SV');
  return documento.save();
}

export async function descargarComprobantePDF(elemento, nombreArchivo) {
  const campos = Array.from(elemento.querySelectorAll('dl > div')).map(fila => [
    fila.querySelector('dt')?.textContent.trim() || '',
    fila.querySelector('dd')?.textContent.trim() || ''
  ]);
  if (!campos.length) throw new Error('No hay datos del comprobante para descargar.');
  const bytes = await crearComprobantePDF(campos);
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  // Dar tiempo al navegador móvil para abrir o descargar el archivo.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
