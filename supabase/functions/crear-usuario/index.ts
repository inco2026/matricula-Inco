import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Solo se ejecuta en el servidor. No copiar claves secretas al sitio web.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respuesta = (status, cuerpo) => new Response(JSON.stringify(cuerpo), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});

const nombreNormalizado = valor => typeof valor === "string" ? valor.trim().replace(/\s+/gu, " ") : "";
const patronNombre = nombre => nombre.replace(/[\\%_]/g, caracter => "\\" + caracter);

export async function ingresarPorNombre(admin, autenticar, cuerpo) {
  const nombre = nombreNormalizado(cuerpo.nombre);
  const clave = typeof cuerpo.contrasena === "string" ? cuerpo.contrasena : "";
  const invalido = () => respuesta(401, { error: "Nombre o contraseña incorrectos." });
  if (!nombre || nombre.length > 80 || !clave || clave.length > 128) return invalido();
  const { data: perfiles, error } = await admin.from("perfiles")
    .select("*").ilike("nombre", patronNombre(nombre)).limit(2);
  if (error) return respuesta(503, { error: "No se pudo comprobar el acceso. Intente nuevamente." });
  if (perfiles?.length !== 1 || perfiles[0].activo === false || !perfiles[0].correo) return invalido();
  const perfil = perfiles[0];
  const { data, error: errorAcceso } = await autenticar(perfil.correo, clave);
  if (errorAcceso || !data?.session || data.user?.id !== perfil.id) return invalido();
  // El correo no se publica para resolver el nombre; solo se devuelve la sesión
  // al titular que demostró conocer la contraseña de esa cuenta.
  return respuesta(200, { ok: true, session: {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  } });
}

export function crearManejador(admin, autenticar) {
  return async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") return respuesta(405, { error: "Método no permitido." });
    try {
      let cuerpo;
      try { cuerpo = await req.json(); } catch { return respuesta(400, { error: "Datos inválidos." }); }
      if (cuerpo?.accion === "ingresar") return await ingresarPorNombre(admin, autenticar, cuerpo);
      const token = req.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
      if (!token) return respuesta(401, { error: "Inicie sesión como administrador." });
      const { data: auth, error: errorAuth } = await admin.auth.getUser(token);
      if (errorAuth || !auth?.user) return respuesta(401, { error: "La sesión expiró. Ingrese nuevamente." });
      const { data: perfil, error: errorPerfil } = await admin.from("perfiles")
        .select("*").eq("id", auth.user.id).single();
      if (errorPerfil) {
        console.error("crear-usuario: consulta de permisos", errorPerfil.code);
        return respuesta(500, { codigo: "CONSULTA_PERFIL", error: "No se pudo consultar el perfil de " + (auth.user.email || auth.user.id) + ". Código: " + (errorPerfil.code || "sin detalle") + ". Detalle: " + (errorPerfil.message || "sin detalle") + ". No se creó ningún usuario." });
      }
      if (perfil?.activo === false) return respuesta(403, { error: "Su cuenta está inhabilitada." });
      if (perfil?.rol !== "administrador") {
        return respuesta(403, { codigo: "ROL_NO_AUTORIZADO", error: "La cuenta conectada " + (auth.user.email || "") + " no tiene rol de administrador. No se creó ningún usuario." });
      }
      const nombre = nombreNormalizado(cuerpo?.nombre);
      const correo = typeof cuerpo?.correo === "string" ? cuerpo.correo.trim().toLowerCase() : "";
      const contrasena = typeof cuerpo?.contrasena === "string" ? cuerpo.contrasena : "";
      const rol = cuerpo?.rol;
      if (!nombre || nombre.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
          || contrasena.length < 8 || contrasena.length > 128
          || !["administrador", "coordinador", "docente"].includes(rol)) {
        return respuesta(400, { error: "Revise el nombre, correo, contraseña (8 a 128 caracteres) y rol." });
      }
      const { data: coincidencias, error: errorNombre } = await admin.from("perfiles")
        .select("id").ilike("nombre", patronNombre(nombre)).limit(1);
      if (errorNombre) return respuesta(500, { error: "No se pudo verificar el nombre. No se creó la cuenta." });
      if (coincidencias?.length) return respuesta(409, { error: "Ese nombre ya está en uso. Incluya sus nombres y apellidos para distinguir la cuenta." });
      const { data: cuenta, error: errorCuenta } = await admin.auth.admin.createUser({
        email: correo, password: contrasena, email_confirm: true, user_metadata: { nombre },
      });
      if (errorCuenta || !cuenta?.user) {
        const duplicado = /already|registered|exists/i.test(errorCuenta?.message || "");
        return respuesta(duplicado ? 409 : 400, {
          error: duplicado ? "Ese correo ya tiene una cuenta. Utilice otro correo." : "No se pudo crear la cuenta. " + (errorCuenta?.message || "Intente nuevamente."),
        });
      }
      const id = cuenta.user.id;
      // Upsert contempla proyectos que ya crean un perfil con un trigger.
      let usuario, errorGuardar;
      try {
        ({ data: usuario, error: errorGuardar } = await admin.from("perfiles")
          .upsert({ id, nombre, correo, rol }, { onConflict: "id" })
          .select("id, nombre, correo, rol, creado_en").single());
      } catch {
        errorGuardar = true;
      }
      if (errorGuardar || !usuario || usuario.rol !== rol) {
        // Evita dejar una cuenta sin perfil o con el rol equivocado.
        const { error: errorRevertir } = await admin.auth.admin.deleteUser(id);
        if (errorRevertir) {
          console.error("No se pudo revertir cuenta incompleta", id);
          return respuesta(500, { error: "La cuenta quedó incompleta. Contacte al encargado técnico antes de reintentar." });
        }
        return respuesta(500, { error: "No se pudo guardar el perfil. La creación fue cancelada; no se creó el usuario." });
      }
      return respuesta(201, { ok: true, usuario });
    } catch {
      return respuesta(500, { error: "No se pudo completar la creación. Contacte al encargado técnico antes de reintentar." });
    }
  };
}

const admin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);
Deno.serve(crearManejador(admin, async (correo, contrasena) => {
  // Cliente separado: iniciar sesión no reemplaza las credenciales del servidor.
  const cliente = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente.auth.signInWithPassword({ email: correo, password: contrasena });
}));
