-- Table to record medication administrations to patients
CREATE TABLE public.administracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID NOT NULL REFERENCES public.medicamentos(id) ON DELETE RESTRICT,
  movimentacao_id UUID REFERENCES public.movimentacoes(id) ON DELETE SET NULL,
  paciente_nome TEXT NOT NULL,
  dose_aplicada NUMERIC(10,3) NOT NULL CHECK (dose_aplicada > 0),
  unidade_dose TEXT NOT NULL,
  unidades_consumidas INTEGER NOT NULL DEFAULT 1 CHECK (unidades_consumidas > 0),
  data_administracao TIMESTAMPTZ NOT NULL DEFAULT now(),
  responsavel TEXT,
  via_administracao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.administracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_administracoes" ON public.administracoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_administracoes_medicamento_id ON public.administracoes(medicamento_id);
CREATE INDEX idx_administracoes_data ON public.administracoes(data_administracao DESC);
CREATE INDEX idx_administracoes_paciente ON public.administracoes(paciente_nome);

-- Atomic RPC: inserts the administration record and the stock movement in one transaction
CREATE OR REPLACE FUNCTION public.registrar_administracao(
  p_medicamento_id      UUID,
  p_paciente_nome       TEXT,
  p_dose_aplicada       NUMERIC,
  p_unidade_dose        TEXT,
  p_unidades_consumidas INTEGER,
  p_data_administracao  TIMESTAMPTZ DEFAULT now(),
  p_responsavel         TEXT DEFAULT NULL,
  p_via_administracao   TEXT DEFAULT NULL,
  p_observacoes         TEXT DEFAULT NULL
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
  v_adm_id           UUID;
BEGIN
  IF p_dose_aplicada <= 0 THEN
    RAISE EXCEPTION 'A dose aplicada deve ser maior que zero';
  END IF;

  IF p_unidades_consumidas <= 0 THEN
    RAISE EXCEPTION 'As unidades consumidas devem ser maiores que zero';
  END IF;

  SELECT quantidade_atual
    INTO v_quantidade_atual
    FROM public.medicamentos
   WHERE id = p_medicamento_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medicamento não encontrado';
  END IF;

  IF v_quantidade_atual < p_unidades_consumidas THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %', v_quantidade_atual;
  END IF;

  v_nova_quantidade := v_quantidade_atual - p_unidades_consumidas;

  INSERT INTO public.movimentacoes
    (medicamento_id, tipo, quantidade, motivo, responsavel, observacoes)
  VALUES
    (p_medicamento_id, 'saida', p_unidades_consumidas,
     'Administração — Paciente: ' || p_paciente_nome,
     p_responsavel,
     p_observacoes)
  RETURNING id INTO v_mov_id;

  UPDATE public.medicamentos
     SET quantidade_atual = v_nova_quantidade
   WHERE id = p_medicamento_id;

  INSERT INTO public.administracoes
    (medicamento_id, movimentacao_id, paciente_nome, dose_aplicada, unidade_dose,
     unidades_consumidas, data_administracao, responsavel, via_administracao, observacoes)
  VALUES
    (p_medicamento_id, v_mov_id, p_paciente_nome, p_dose_aplicada, p_unidade_dose,
     p_unidades_consumidas, p_data_administracao, p_responsavel, p_via_administracao, p_observacoes)
  RETURNING id INTO v_adm_id;

  RETURN json_build_object(
    'administracao_id', v_adm_id,
    'movimentacao_id', v_mov_id,
    'quantidade_atual', v_nova_quantidade
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_administracao TO authenticated;
