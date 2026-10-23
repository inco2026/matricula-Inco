-- Ejecutar en Supabase antes de publicar los archivos actualizados.
-- Conserva crear_matricula y guarda la disponibilidad en la misma transacción.
-- No convierte documentos declarados en documentos recibidos por el docente.
BEGIN;
DO $instalar$
DECLARE
  funcion regprocedure := to_regprocedure('public.crear_matricula(jsonb)');
  tipo_parametro text := 'jsonb';
  tipo_resultado text;
BEGIN
  IF funcion IS NULL THEN
    funcion := to_regprocedure('public.crear_matricula(json)');
    tipo_parametro := 'json';
  END IF;
  IF funcion IS NULL THEN
    RAISE EXCEPTION 'No se encontró public.crear_matricula(jsonb/json). No se aplicaron cambios.';
  END IF;
  SELECT pg_get_function_result(funcion) INTO tipo_resultado;
  IF tipo_resultado NOT IN ('uuid', 'bigint', 'integer', 'text') THEN
    RAISE EXCEPTION 'Retorno de crear_matricula no compatible: %. No se aplicaron cambios.', tipo_resultado;
  END IF;
  EXECUTE format($crear$
    CREATE OR REPLACE FUNCTION public.crear_matricula_con_documentos(p %1$s)
    RETURNS %2$s
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $cuerpo$
    DECLARE
      matricula_id_nueva %2$s;
      disponibilidad jsonb := p::jsonb -> 'disponibilidadDocumentos';
      tipo_documentacion text;
    BEGIN
      IF disponibilidad IS NULL OR jsonb_typeof(disponibilidad) <> 'object'
        OR jsonb_typeof(disponibilidad -> 'documentos') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Disponibilidad de documentos inválida' USING ERRCODE = '23514';
      END IF;
      IF jsonb_array_length(disponibilidad -> 'documentos') > 10
        OR octet_length(disponibilidad::text) > 20000
        OR disponibilidad ->> 'grado' IS DISTINCT FROM p::jsonb ->> 'grado'
        OR disponibilidad ->> 'tipoIngreso' IS DISTINCT FROM p::jsonb ->> 'tipoIngreso'
        OR EXISTS (SELECT 1 FROM jsonb_array_elements(disponibilidad -> 'documentos') AS d
          WHERE jsonb_typeof(d -> 'disponible') IS DISTINCT FROM 'boolean'
            OR jsonb_typeof(d -> 'texto') IS DISTINCT FROM 'string') THEN
        RAISE EXCEPTION 'Disponibilidad de documentos inválida' USING ERRCODE = '23514';
      END IF;
      matricula_id_nueva := public.crear_matricula(p);
      UPDATE public.documentos_matricula
      SET items = (CASE WHEN jsonb_typeof(items::jsonb) = 'object' THEN items::jsonb ELSE '{}'::jsonb END)
        || jsonb_build_object('disponibilidadEstudiante', disponibilidad)
      WHERE matricula_id = matricula_id_nueva;
      IF NOT FOUND THEN
        tipo_documentacion := CASE p::jsonb ->> 'grado'
          WHEN 'Primer Año' THEN 'primer_nuevo'
          WHEN 'Segundo Año' THEN CASE WHEN p::jsonb ->> 'tipoIngreso' = 'Antiguo ingreso' THEN 'segundo_antiguo' ELSE 'segundo_nuevo' END
          ELSE 'tercer_antiguo' END;
        INSERT INTO public.documentos_matricula (matricula_id, tipo_indicaciones, items, observaciones)
        VALUES (matricula_id_nueva, tipo_documentacion,
          jsonb_build_object('disponibilidadEstudiante', disponibilidad), '');
      END IF;
      RETURN matricula_id_nueva;
    END;
    $cuerpo$;
  $crear$, tipo_parametro, tipo_resultado);
  EXECUTE format('REVOKE ALL ON FUNCTION public.crear_matricula_con_documentos(%s) FROM PUBLIC', tipo_parametro);
  -- Mantener exactamente el acceso de los roles de la función original.
  IF has_function_privilege('anon', funcion, 'EXECUTE') THEN
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.crear_matricula_con_documentos(%s) TO anon', tipo_parametro);
  END IF;
  IF has_function_privilege('authenticated', funcion, 'EXECUTE') THEN
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.crear_matricula_con_documentos(%s) TO authenticated', tipo_parametro);
  END IF;
END;
$instalar$;
COMMIT;
