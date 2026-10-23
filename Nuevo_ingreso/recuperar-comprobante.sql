-- Ejecutar en el editor SQL de Supabase, después de revisar y respaldar.
-- Solo añade la consulta; no crea ni modifica matrículas.
BEGIN;
CREATE TABLE IF NOT EXISTS public.intentos_recuperar_comprobante (
  clave text PRIMARY KEY,
  inicio timestamptz NOT NULL,
  intentos integer NOT NULL
);
ALTER TABLE public.intentos_recuperar_comprobante ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.intentos_recuperar_comprobante FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.recuperar_comprobante(p_nie text, p_nacimiento date, p_dui text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  intentos_actuales integer;
  comprobante jsonb;
BEGIN
  IF p_nie IS NULL OR p_nie !~ '^[0-9]{1,12}$' OR p_nacimiento IS NULL
     OR p_dui IS NULL OR p_dui !~ '^[0-9]{8}-[0-9]$' THEN
    RETURN NULL;
  END IF;
  -- El límite es atómico y compartido por NIE entre todos los dispositivos.
  INSERT INTO public.intentos_recuperar_comprobante AS i (clave, inicio, intentos)
  VALUES (md5(p_nie), clock_timestamp(), 1)
  ON CONFLICT (clave) DO UPDATE SET
    intentos = CASE WHEN i.inicio < clock_timestamp() - interval '15 minutes' THEN 1 ELSE least(i.intentos + 1, 6) END,
    inicio = CASE WHEN i.inicio < clock_timestamp() - interval '15 minutes' THEN clock_timestamp() ELSE i.inicio END
  RETURNING intentos INTO intentos_actuales;
  IF intentos_actuales > 5 THEN RETURN jsonb_build_object('limitado', true); END IF;

  SELECT jsonb_build_object(
    'numeroFicha', m.numero_ficha,
    'nie', a.nie,
    'estudiante', concat_ws(' ', a.primer_nombre, a.segundo_nombre, a.primer_apellido, a.segundo_apellido),
    'grado', m.grado,
    'especialidad', m.especialidad,
    'tipoIngreso', m.tipo_ingreso,
    'fechaMatricula', to_char(m.fecha_matricula::date, 'DD/MM/YYYY'),
    'horaMatricula', m.hora_matricula,
    'responsable', r.nombre,
    'telefonoResponsable', r.telefono,
    'correoResponsable', r.correo
  ) INTO comprobante
  FROM public.matriculas m
  JOIN public.alumnos a ON a.id = m.alumno_id
  JOIN public.responsables r ON r.alumno_id = a.id
  WHERE btrim(a.nie::text) = p_nie
    AND a.fecha_nacimiento::date = p_nacimiento
    AND regexp_replace(r.dui::text, '[^0-9]', '', 'g') = replace(p_dui, '-', '')
  ORDER BY m.anio_lectivo DESC, m.creado_en DESC, m.id DESC
  LIMIT 1;
  -- El mismo resultado para NIE inexistente y datos de verificación incorrectos.
  RETURN comprobante;
END;
$$;
REVOKE ALL ON FUNCTION public.recuperar_comprobante(text,date,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recuperar_comprobante(text,date,text) TO anon, authenticated;
COMMIT;
