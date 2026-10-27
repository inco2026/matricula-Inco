-- Ejecutar completo en el SQL Editor de Supabase antes de publicar el formulario.
-- Conserva las funciones actuales y guarda matrícula, documentos y modalidad
-- en una sola transacción. No asigna una modalidad inventada a registros anteriores.
BEGIN;
ALTER TABLE public.matriculas ADD COLUMN IF NOT EXISTS tipo_modalidad text;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.matriculas'::regclass AND conname='matriculas_tipo_modalidad_valida') THEN
  ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_tipo_modalidad_valida
   CHECK (tipo_modalidad IS NULL OR tipo_modalidad IN ('Modalidad Regular','Modalidad Alterna (Sábados)'));
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.crear_matricula_con_modalidad(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
 modalidad text := p->>'tipoModalidad';
 ficha text := p->>'numeroFicha';
 funcion text;
 tipo text;
 resultado jsonb;
 cantidad integer;
BEGIN
 IF modalidad IS NULL OR modalidad NOT IN ('Modalidad Regular','Modalidad Alterna (Sábados)') THEN
  RAISE EXCEPTION 'Seleccione un tipo de modalidad válido.' USING ERRCODE='22023';
 END IF;
 IF ficha IS NULL OR btrim(ficha)='' THEN RAISE EXCEPTION 'Falta el número de ficha.'; END IF;
 IF EXISTS (SELECT 1 FROM public.matriculas WHERE numero_ficha=ficha) THEN
  RAISE EXCEPTION 'matriculas_numero_ficha_key: ficha ya registrada' USING ERRCODE='23505';
 END IF;
 funcion := CASE WHEN p->'disponibilidadDocumentos' IS NOT NULL AND p->'disponibilidadDocumentos'<>'null'::jsonb
  THEN 'crear_matricula_con_documentos' ELSE 'crear_matricula' END;
 IF to_regprocedure('public.'||funcion||'(jsonb)') IS NOT NULL THEN tipo:='jsonb';
 ELSIF to_regprocedure('public.'||funcion||'(json)') IS NOT NULL THEN tipo:='json';
 ELSE RAISE EXCEPTION 'No existe la función requerida: %. Instale primero el guardado actual de matrícula/documentos.', funcion;
 END IF;
 EXECUTE format('SELECT to_jsonb(public.%I($1::%s))',funcion,tipo) INTO resultado USING p;
 UPDATE public.matriculas SET tipo_modalidad=modalidad WHERE numero_ficha=ficha;
 GET DIAGNOSTICS cantidad=ROW_COUNT;
 IF cantidad<>1 THEN RAISE EXCEPTION 'No se pudo vincular la modalidad a una matrícula única. No se guardaron cambios.'; END IF;
 RETURN resultado;
END;
$$;
REVOKE ALL ON FUNCTION public.crear_matricula_con_modalidad(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_matricula_con_modalidad(jsonb) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
