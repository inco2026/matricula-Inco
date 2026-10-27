# Activar los botones Inhabilitar / Habilitar

Esta instalación se hace una sola vez. El uso posterior es desde **Usuarios**.
No se eliminan cuentas ni se cambian sus correos, contraseñas o roles.

1. Abrir `activar-inhabilitacion.sql` de esta carpeta y copiar TODO el contenido.
2. En el proyecto Supabase del sistema, entrar en **SQL Editor → New query**,
   pegarlo y pulsar **Run**. Debe terminar en Success. Los usuarios actuales
   quedan activos. Si aparece un error, detenerse y conservar el mensaje.
3. Abrir `functions/crear-usuario/index.ts` de esta carpeta y copiar TODO.
4. En **Edge Functions → crear-usuario → Code → index.ts**, conservar una copia
   del código anterior, reemplazarlo por el nuevo y pulsar **Deploy updates**.
   Esta actualización impide que una cuenta administradora inhabilitada siga
   usando la función con una sesión anterior.
5. Recargar el sistema con **Ctrl + F5** e ingresar como administrador.
6. En **Usuarios**, probar **Inhabilitar** sobre una cuenta de prueba autorizada.
   Su estado debe pasar a Inhabilitado; luego pulsar **Habilitar** para revertirlo.
   Comprobar el acceso de esa cuenta en una ventana privada en ambos estados.

La columna Estado y los botones están preparados en el proyecto local. No se
han aplicado estos cambios en la base de datos remota desde esta sesión.

El SQL incorpora una columna `activo`, una operación autorizada exclusivamente
para administradores activos y una restricción adicional sobre las tablas del
sistema que ya usan RLS. Esta restricción bloquea consultas y escrituras de las
sesiones inhabilitadas sin ampliar los permisos existentes. También evita cambiar
el estado directamente sin permiso, inhabilitarse a uno mismo o inhabilitar al
último administrador activo. Las cuentas se conservan para poder reactivarlas.

Las pruebas se realizaron con PostgreSQL embebido y APIs simuladas en navegador;
la verificación de despliegue con usuarios reales queda pendiente de los pasos
anteriores. Los archivos del sitio deben publicarse también si se usa hosting.
