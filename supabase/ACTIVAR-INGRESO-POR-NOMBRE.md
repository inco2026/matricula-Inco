# Ingreso por nombre completo

El formulario de acceso solicita el nombre completo y la contraseña. El nombre
corresponde al guardado al crear la cuenta en Usuarios. El correo sigue siendo
obligatorio al crear usuarios y se registra en Supabase Authentication mediante
`auth.admin.createUser`, junto con el perfil y el rol.

## Activación única

1. Copiar todo `functions/crear-usuario/index.ts` de esta carpeta.
2. En Supabase, abrir **Edge Functions → crear-usuario → Code → index.ts**.
3. Conservar una copia de la versión anterior, reemplazar por la nueva y pulsar
   **Deploy updates**. No se necesita ejecutar SQL ni recrear las cuentas.
4. Recargar la entrada del sistema con **Ctrl + F5** y comprobar el acceso con el
   nombre completo de una cuenta existente y su contraseña.

La función ya sirve para crear usuarios y ahora también comprueba el ingreso
cuando recibe `accion: "ingresar"`. Esa operación debe ser accesible antes de
iniciar sesión; conserva la comprobación de contraseña con Supabase Auth. No
cambiar la configuración de seguridad de otras funciones. En este proyecto la
función ya respondía a solicitudes sin sesión. Si aparece un rechazo del gateway
antes de ejecutar el código, revisar únicamente la configuración de esta función.

El nombre no distingue mayúsculas/minúsculas. Se recortan espacios en los extremos
y se normalizan espacios al crear cuentas. Se rechazan nombres repetidos al crear
y no se permite ingresar si varias cuentas antiguas comparten el mismo nombre.
El servidor no revela el correo para resolver un nombre. Una sesión solo se
devuelve cuando Supabase valida la contraseña y el UID coincide con el perfil.

Se conserva el bloqueo de cuentas inhabilitadas. La prueba remota de la versión
publicada queda pendiente de la activación anterior.
