BEGIN;
ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS revision_completa boolean,
  ADD COLUMN IF NOT EXISTS revisado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revisado_por_nombre text,
  ADD COLUMN IF NOT EXISTS revisado_en timestamptz,
  ADD COLUMN IF NOT EXISTS situacion_matricula text GENERATED ALWAYS AS
    (CASE WHEN revision_completa IS TRUE THEN 'Matriculado' ELSE 'Inscrito' END) STORED;

CREATE OR REPLACE FUNCTION public.proteger_revision_matricula()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor public.perfiles%ROWTYPE;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.revision_completa IS NULL AND NEW.revisado_por IS NULL
    AND NEW.revisado_por_nombre IS NULL AND NEW.revisado_en IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' OR NEW.revision_completa IS DISTINCT FROM OLD.revision_completa
     OR NEW.revisado_por IS DISTINCT FROM OLD.revisado_por
     OR NEW.revisado_por_nombre IS DISTINCT FROM OLD.revisado_por_nombre
     OR NEW.revisado_en IS DISTINCT FROM OLD.revisado_en THEN
    SELECT * INTO actor FROM public.perfiles WHERE id = auth.uid();
    IF actor.rol IS DISTINCT FROM 'administrador' OR coalesce(to_jsonb(actor)->>'activo','true') = 'false' THEN
      RAISE EXCEPTION 'Solo un administrador activo puede revisar la matrícula.';
    END IF;
    IF NEW.revision_completa IS NULL THEN RAISE EXCEPTION 'Seleccione completo o incompleto.'; END IF;
    NEW.revisado_por := auth.uid();
    NEW.revisado_por_nombre := actor.nombre;
    NEW.revisado_en := clock_timestamp();
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.proteger_revision_matricula() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS proteger_revision_matricula ON public.matriculas;
CREATE TRIGGER proteger_revision_matricula BEFORE INSERT OR UPDATE ON public.matriculas
FOR EACH ROW EXECUTE FUNCTION public.proteger_revision_matricula();

CREATE OR REPLACE FUNCTION public.revisar_matricula(p_id uuid, p_completa boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE resultado jsonb;
BEGIN
  IF p_completa IS NULL THEN RAISE EXCEPTION 'Seleccione completo o incompleto.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid()
    AND p.rol = 'administrador' AND coalesce(to_jsonb(p)->>'activo','true') <> 'false') THEN
    RAISE EXCEPTION 'Solo un administrador activo puede revisar la matrícula.';
  END IF;
  UPDATE public.matriculas SET revision_completa = p_completa, revisado_en = clock_timestamp()
    WHERE id = p_id RETURNING jsonb_build_object('id',id,'revision_completa',revision_completa,
      'situacion_matricula',situacion_matricula,'revisado_por',revisado_por,'revisado_por_nombre',revisado_por_nombre,
      'revisado_en',revisado_en) INTO resultado;
  IF resultado IS NULL THEN RAISE EXCEPTION 'No se encontró la matrícula.'; END IF;
  RETURN resultado;
END; $$;
REVOKE ALL ON FUNCTION public.revisar_matricula(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revisar_matricula(uuid, boolean) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
