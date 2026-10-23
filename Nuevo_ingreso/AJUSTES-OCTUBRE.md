Cambios del 22 de octubre de 2026

- Correo personal: máximo 35 caracteres, incluido el dominio.
- Lugar de trabajo del padre y de la madre: máximo 40 caracteres.
- Verificados los prefijos con el Plan de Numeración 2025 de SIGET: teléfonos generales del estudiante y responsable admiten 2/5/6/7; celulares de madre y padre y WhatsApp admiten 5/6/7. Todos requieren ocho dígitos. Las reglas se comparten mediante `../telefonos-sv.js` y se comprueban también antes de guardar ediciones de Docente y Administrador. Publicar este archivo compartido junto con los demás cambios. Un teléfono fijo del responsable no se copia al celular de la madre o el padre.
- Aviso de validación breve; los errores se explican junto a cada campo.
- Restaurada la etiqueta «Administrativo Contable (Segundos y Terceros)». Conserva su valor Administrativo Contable para guardar la carrera correcta. Las demás opciones y su orden se conservan.
- Todas las listas de documentación conservan sus requisitos y añaden checks opcionales, contador de disponibles y pendientes y recuperación del borrador. Al cambiar grado o tipo de ingreso, cada lista mantiene sus propias selecciones; solo se envía la lista correspondiente a la matrícula.
- Las selecciones se muestran al docente y al administrador como disponibilidad declarada por el estudiante. La recepción de documentos que registra el docente se conserva por separado.
- Botones Subir foto y Tomar foto. En teléfonos compatibles se solicita la cámara frontal; en equipos sin captura el navegador puede mostrar el selector de archivos. La captura se prepara como JPG de hasta 1600 píxeles de lado y se conserva en el borrador.
- Comprobante y ficha oficial adaptados a móvil; impresión y exportación conservan el formato de papel.
- Corregido el recorte al descargar el comprobante: `comprobante-pdf.js` genera texto y líneas en A4, independientemente del CSS, el desplazamiento y el tamaño de pantalla. Lo comparten la descarga al terminar la matrícula y la recuperación. La biblioteca PDF se incluye localmente en `vendor/`, con su licencia; publicar también esa carpeta.

Antes de publicar

1. Ejecutar `documentos-disponibles.sql` en el editor SQL de Supabase. No se ejecutó contra la base de datos del proyecto porque esta sesión no tiene acceso administrativo a ella. El script agrega `crear_matricula_con_documentos`, mantiene la función original y guarda matrícula y disponibilidad en una sola transacción. Si falla algún guardado, se revierte todo.
2. Publicar los archivos modificados de `Nuevo_ingreso` y también los archivos compartidos de la carpeta superior: `supabase-data.js`, `documentacion-disponible.js`, `ficha-oficial.css`, `Administrador/admin.html`, `Administrador/admin.js` y `Docente/docente.js`.
3. Probar una matrícula desde un teléfono real. La apertura física de la cámara depende del navegador y los permisos del dispositivo.

Verificación local

`node --test validaciones.test.mjs telefonos-sv.test.mjs ficha-aleatoria.test.mjs recuperar-comprobante.test.cjs formulario.browser.test.cjs ajustes.browser.test.cjs comprobante-pdf.browser.test.cjs`

Las pruebas usan servicios simulados y no envían matrículas reales. Incluyen ambas entradas HTML, envío completo, borrador, documentos 1 y 4, captura simulada y anchos 360, 390, 768 y 1366 px. La migración también se verificó con PostgreSQL local mediante PGlite: `PGLITE_PATH` debe apuntar al archivo `dist/index.js` de ese paquete para ejecutar `node --test documentos-disponibles.test.mjs`.
