BEGIN;

ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.usuario_habilitado()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND activo); $$;
REVOKE ALL ON FUNCTION public.usuario_habilitado() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_habilitado() TO authenticated;

CREATE OR REPLACE FUNCTION public.proteger_estado_usuario()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.activo IS NOT DISTINCT FROM OLD.activo THEN RETURN NEW; END IF;
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'administrador' AND activo
  ) THEN RAISE EXCEPTION 'Solo un administrador activo puede cambiar el estado.'; END IF;
  IF NEW.id = auth.uid() AND NOT NEW.activo THEN
    RAISE EXCEPTION 'No puede inhabilitar su propia cuenta.';
  END IF;
  IF NOT NEW.activo AND OLD.rol = 'administrador' AND OLD.activo THEN
    LOCK TABLE public.perfiles IN SHARE ROW EXCLUSIVE MODE;
    IF NOT EXISTS (SELECT 1 FROM public.perfiles WHERE rol = 'administrador' AND activo AND id <> OLD.id) THEN
      RAISE EXCEPTION 'Debe conservar al menos un administrador activo.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.proteger_estado_usuario() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS proteger_estado_usuario ON public.perfiles;
CREATE TRIGGER proteger_estado_usuario BEFORE UPDATE OF activo ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION public.proteger_estado_usuario();

CREATE OR REPLACE FUNCTION public.cambiar_estado_usuario(p_id uuid, p_activo boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE resultado jsonb;
BEGIN
  LOCK TABLE public.perfiles IN SHARE ROW EXCLUSIVE MODE;
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'administrador' AND activo
  ) THEN RAISE EXCEPTION 'Solo un administrador activo puede cambiar el estado.'; END IF;
  IF p_activo IS NULL THEN RAISE EXCEPTION 'Estado inválido.'; END IF;
  UPDATE public.perfiles SET activo = p_activo WHERE id = p_id
    RETURNING jsonb_build_object('id', id, 'activo', activo) INTO resultado;
  IF resultado IS NULL THEN RAISE EXCEPTION 'No se encontró el usuario.'; END IF;
  RETURN resultado;
END; $$;
REVOKE ALL ON FUNCTION public.cambiar_estado_usuario(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cambiar_estado_usuario(uuid, boolean) TO authenticated;

-- Las sesiones ya abiertas tampoco podrán consultar ni modificar estas tablas.
-- Las políticas existentes siguen definiendo los permisos de cada rol.
DO $$ DECLARE tabla text; BEGIN
  FOREACH tabla IN ARRAY ARRAY['perfiles','alumnos','matriculas','padres','responsables','salud','residencias','recursos','estudios','documentos_matricula'] LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
               WHERE n.nspname = 'public' AND c.relname = tabla AND c.relrowsecurity) THEN
      EXECUTE format('DROP POLICY IF EXISTS cuenta_habilitada ON public.%I', tabla);
      EXECUTE format('CREATE POLICY cuenta_habilitada ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.usuario_habilitado())) WITH CHECK ((SELECT public.usuario_habilitado()))', tabla);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
