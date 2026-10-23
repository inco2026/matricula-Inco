# Recuperar comprobante

Implementación local: enlace desde el inicio y desde el panel final; página independiente que solicita NIE, fecha de nacimiento y DUI del responsable registrado. Consulta exclusivamente `recuperar_comprobante`; no usa la búsqueda administrativa de matrículas ni escribe una matrícula. Permite imprimir o descargar PDF (si la librería no carga, indica Imprimir → Guardar como PDF). No guarda comprobantes ni credenciales en localStorage y limpia la pantalla al salir.

## Activación pendiente

La función SQL **no se ha ejecutado en Supabase**. Revisar `recuperar-comprobante.sql` contra el esquema real, respaldar y ejecutarlo en el editor SQL del proyecto. No necesita las otras migraciones pendientes. Sin ella, la página informa que la recuperación no está habilitada. La migración añade una tabla privada para el contador de consultas y una función pública limitada; no modifica matrículas.

La función comprueba los tres datos dentro de PostgreSQL y devuelve solamente los campos del comprobante. Limita a cinco consultas por NIE cada quince minutos, de forma atómica, incluidas las consultas correctas. No devuelve si un NIE existe cuando falla la verificación. Una persona que conozca los tres datos podrá consultar el comprobante: esta verificación no sustituye un código enviado al correo o teléfono. El límite por NIE puede retrasar una consulta legítima si alguien más agota sus intentos.

Revisar también las políticas RLS existentes de alumnos, responsables y matrículas: esta función no revoca accesos directos que el proyecto ya pudiera tener. No hay acceso administrativo disponible para auditar esos permisos. Antes de producción, comprobar desde una sesión anónima que no se pueden leer directamente esas tablas.

## Verificación

`node --test recuperar-comprobante.test.cjs validaciones.test.mjs ficha-aleatoria.test.mjs formulario.browser.test.cjs`

Las pruebas de recuperación simulan Supabase: acceso desde inicio, parámetros enviados, datos incorrectos, ficha original, bloqueo de doble consulta, contenido HTML seguro, impresión, PDF y su alternativa, cierre, recarga y error de función no instalada. No se han probado la migración ni consultas reales en PostgreSQL. Después de activarla, comprobar con una matrícula autorizada: coincidencia de los tres datos, rechazo al cambiar cada uno, sexta consulta limitada, conservación del número de ficha y ausencia de matrículas nuevas.
