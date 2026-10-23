# Revisión de entrada del formulario

- Nombres y apellidos del estudiante, responsable, padres y hermanos: bloquean números, emojis y símbolos ajenos al nombre al escribir o pegar. Conservan letras con acentos, espacios, apóstrofos y guiones. La validación de contenido se mantiene al avanzar y guardar.
- NIE, DUI y campos numéricos: bloquean la escritura y el pegado de letras. Distancia admite punto decimal; DUI admite su guion.
- Los cinco teléfonos bloquean letras al escribir o pegar. Si un autocompletado o una asignación externa introduce letras, el formulario conserva el error y no convierte silenciosamente el texto en otro número válido. Se mantienen ocho dígitos, prefijos salvadoreños y rechazo de patrones repetidos o secuenciales.
- Direcciones, colegios y lugares de trabajo mantienen números legítimos y sus validaciones descriptivas. Correos, fechas, opciones, fotografía, borrador y guardado conservan sus reglas.

La validación de formato no demuestra que un teléfono exista o pertenezca al estudiante. No se añadió verificación por SMS ni se ejecutaron migraciones en Supabase.

Pruebas: ajustes.browser.test.cjs, formulario.browser.test.cjs, publicacion.browser.test.cjs, validaciones.test.mjs y telefonos-sv.test.mjs. Los envíos se prueban con Supabase simulado.
