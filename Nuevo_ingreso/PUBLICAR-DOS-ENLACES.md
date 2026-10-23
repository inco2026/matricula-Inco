Dos entradas separadas

- Estudiantes: `https://consuavalos.github.io/matricula-Inco-v1/` o `https://consuavalos.github.io/matricula-Inco-v1/Nuevo_ingreso/`. Solo aparece el botón Matrícula.
- Personal: `https://consuavalos.github.io/matricula-Inco-v1/administracion.html`. Solo aparece el inicio de sesión del personal.

La carpeta `Nuevo_ingreso` ya incluye sus módulos, conexión pública a Supabase, imágenes y biblioteca PDF. Puede publicarse sola, sin archivos de carpetas superiores. Si se publica el contenido de esa carpeta como raíz de otro repositorio, también funciona desde su propio `index.html`.

Para actualizar el repositorio actual, descomprimir `publicar-dos-enlaces.zip` y subir su contenido a la raíz del repositorio. Mantener `Nuevo_ingreso` como carpeta; `index.html`, `administracion.html` y `auth-guard.js` van en la raíz. El paquete conserva el resto de los archivos existentes del repositorio: los paneles de Administrador, Docente y Coordinador, `app.js`, `style.css`, `supabase-config.js` y las imágenes de la raíz deben seguir publicados.

Los enlaces anteriores quedan actualizados después de publicar los cambios en GitHub Pages. La carpeta local por sí sola no actualiza la página de GitHub.

Al terminar una matrícula o volver desde recuperación, el estudiante regresa a la bienvenida pública. Los usuarios del personal sin sesión, o al cerrar sesión, regresan al enlace de personal.

Estos cambios no ejecutan SQL ni modifican la estructura de Supabase. Se mantienen los procedimientos de guardado ya usados por el formulario.

Pruebas: `node --test publicacion.browser.test.cjs formulario.browser.test.cjs recuperar-comprobante.test.cjs ajustes.browser.test.cjs`.
