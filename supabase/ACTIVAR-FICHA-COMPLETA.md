# Ficha de matrícula completa y tamaño carta

## Activación única

1. Copiar TODO `activar-datos-formulario.sql` de esta carpeta.
2. En Supabase, abrir SQL Editor → New query, pegarlo y pulsar Run.
3. Esperar Success. No es necesario actualizar Edge Functions para este cambio.
4. Recargar los paneles y el formulario con Ctrl + F5. Si el sitio está publicado,
   publicar también los archivos del proyecto, incluidos ficha-oficial.js,
   ficha-oficial.css y sus referencias en los paneles.

El SQL mantiene el guardado de modalidad y conserva una copia del formulario
en `matriculas.datos_formulario` (sin duplicar la fotografía). También guarda el
país de nacimiento en alumnos. Todo se ejecuta en la misma transacción de la
matrícula. Se conservan las funciones existentes de matrícula y documentos.

Docente y administrador muestran país y modalidad, usan las mismas validaciones
compartidas y recuperan las condiciones de salud y los hermanos almacenados.
La ficha se autocompleta con los datos guardados; las firmas permanecen manuales.
No se inventan correos de padre o madre ni otros datos que no se hayan solicitado.
Los registros antiguos conservan lo que exista en la base de datos; la migración
no puede reconstruir información que antes no se hubiera guardado.

La impresión de la ficha usa un documento separado para evitar que el formato
de los paneles altere el papel carta. La descarga PDF del administrador también
usa carta. La vista previa de ejemplo se verificó en una página de 612 × 792 pt.
Los datos extensos pueden continuar en otra página carta sin recortar información.
