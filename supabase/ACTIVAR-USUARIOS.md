# Activación técnica única de la creación de usuarios

El uso diario se realiza en el sistema: **Usuarios → Nuevo usuario → nombre,
correo, contraseña y rol → Crear usuario**. La persona que administra el centro
no necesita entrar en Supabase para dar de alta cuentas.

## Paso pendiente del encargado técnico

La interfaz llama a la Edge Function `crear-usuario`. El código de la función
publicada no se pudo consultar ni actualizar desde esta sesión. Antes de entregar
el sistema, actualizarla con `functions/crear-usuario/index.ts` de esta carpeta.

En el proyecto Supabase correcto:

1. Entrar en **Edge Functions → crear-usuario → Code**.
2. Conservar una copia del código anterior antes de sustituirlo.
3. Sustituir `index.ts` por el contenido completo de
   `functions/crear-usuario/index.ts` y publicar los cambios.
4. La función usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del entorno del
   servidor. Nunca poner la clave de servicio en el HTML ni en el JavaScript
   público.
5. Desde una sesión de administrador del sistema, comprobar con cuentas de prueba
   autorizadas que cada rol se crea y entra en su panel correspondiente. Verificar
   también que la lista Usuarios muestra todos los roles bajo las políticas RLS
   del proyecto. Las pruebas locales usan servicios simulados; no prueban las
   políticas ni la función remota instalada.

Alternativa para un encargado con CLI Supabase autenticado:

```powershell
supabase functions deploy crear-usuario --project-ref vyopgfclpxhkqqxiatmv
```

La función verifica la sesión en el servidor y exige el rol `administrador` de
la tabla `perfiles`. Crea la cuenta confirmada y su perfil con el mismo UID.
Si falla el perfil, intenta revertir exclusivamente la cuenta recién creada.
No modifica cuentas existentes y rechaza correos ya registrados.

## Verificación local

```powershell
node --test Administrador/usuarios-servidor.test.cjs Administrador/restricciones.browser.test.cjs Administrador/reportes-data.test.cjs
```
