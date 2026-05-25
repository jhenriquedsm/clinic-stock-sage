-- Atomic stock movement: inserts the movimentacao and updates quantidade_atual
-- in a single transaction, with row-level lock to prevent race conditions.
CREATE OR REPLACE FUNCTION public.registrar_movimentacao(
  p_medicamento_id UUID,
  p_tipo          TEXT,
  p_quantidade    INTEGER,
  p_motivo        TEXT DEFAULT NULL,
  p_responsavel   TEXT DEFAULT NULL,
  p_observacoes   TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_quantidade_atual INTEGER;
  v_nova_quantidade  INTEGER;
  v_mov_id           UUID;
BEGIN
  IF p_tipo NOT IN ('entrada', 'saida') THEN
    RAISE EXCEPTION 'tipo inválido: %', p_tipo;
  END IF;

  IF p_quantidade <= 0 THEN
    RAISE EXCEPTION 'quantidade deve ser maior que zero';
  END IF;

  -- Lock the row to prevent concurrent stock updates
  SELECT quantidade_atual
    INTO v_quantidade_atual
    FROM public.medicamentos
   WHERE id = p_medicamento_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medicamento não encontrado';
  END IF;

  IF p_tipo = 'saida' THEN
    IF v_quantidade_atual < p_quantidade THEN
      RAISE EXCEPTION 'Estoque insuficiente. Disponível: %', v_quantidade_atual;
    END IF;
    v_nova_quantidade := v_quantidade_atual - p_quantidade;
  ELSE
    v_nova_quantidade := v_quantidade_atual + p_quantidade;
  END IF;

  INSERT INTO public.movimentacoes
    (medicamento_id, tipo, quantidade, motivo, responsavel, observacoes)
  VALUES
    (p_medicamento_id, p_tipo, p_quantidade, p_motivo, p_responsavel, p_observacoes)
  RETURNING id INTO v_mov_id;

  UPDATE public.medicamentos
     SET quantidade_atual = v_nova_quantidade
   WHERE id = p_medicamento_id;

  RETURN json_build_object(
    'id', v_mov_id,
    'quantidade_atual', v_nova_quantidade
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_movimentacao TO authenticated;
