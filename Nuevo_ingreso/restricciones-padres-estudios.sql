-- PENDIENTE de aplicar en Supabase, tras revisar el esquema y respaldar.
-- Un DUI solo puede aparecer una vez entre todos los padres y madres.
-- Esta regla también impide reutilizarlo para matricular a otro hijo.
-- Se conserva la copia del DUI en responsables cuando es el mismo padre/madre.
BEGIN;
LOCK TABLE public.padres IN ACCESS EXCLUSIVE MODE;

CREATE TABLE IF NOT EXISTS public.duis_padres_unicos (
  dui text PRIMARY KEY,
  padre_registro text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('madre', 'padre')),
  UNIQUE (padre_registro, rol)
);
ALTER TABLE public.duis_padres_unicos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.duis_padres_unicos FROM PUBLIC, anon, authenticated;

-- Reconstrucción transaccional: si existen duplicados, falla y revierte todo.
DELETE FROM public.duis_padres_unicos;
INSERT INTO public.duis_padres_unicos (dui, padre_registro, rol)
SELECT regexp_replace(v.dui, '[^0-9]', '', 'g'), p.id::text, v.rol
FROM public.padres p
CROSS JOIN LATERAL (VALUES ('madre', p.madre_dui::text), ('padre', p.padre_dui::text)) v(rol, dui)
WHERE nullif(btrim(v.dui), '') IS NOT NULL;

CREATE OR REPLACE FUNCTION public.reservar_duis_padres()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  IF TG_OP => 'INSERT' THEN
    DELETE FROM public.duis_padres_unicos WHERE padre_registro = OLD.id::text;
  END IF;
  IF TG_OP => 'DELETE' THEN
    INSERT INTO public.duis_padres_unicos (dui, padre_registro, rol)
    SELECT regexp_replace(v.dui, '[^0-9]', '', 'g'), NEW.id::text, v.rol
    FROM (VALUES ('madre', NEW.madre_dui::text), ('padre', NEW.padre_dui::text)) v(rol, dui)
    WHERE nullif(btrim(v.dui), '') IS NOT NULL;
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION public.reservar_duis_padres() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS reservar_duis_padres ON public.padres;
CREATE TRIGGER reservar_duis_padres AFTER INSERT OR UPDATE OR DELETE ON public.padres
FOR EACH ROW EXECUTE FUNCTION public.reservar_duis_padres();

ALTER TABLE public.matriculas DROP CONSTRAINT IF EXISTS tercer_anio_sin_general;
ALTER TABLE public.matriculas ADD CONSTRAINT tercer_anio_sin_general
  CHECK (NOT (grado = 'Tercer Año' AND especialidad = 'Bachillerato General'));
ALTER TABLE public.responsables DROP CONSTRAINT IF EXISTS correo_responsable_usuario_25;
ALTER TABLE public.responsables ADD CONSTRAINT correo_responsable_usuario_25
  CHECK (char_length(split_part(correo, '@', 1)) <= 15);
COMMIT;
