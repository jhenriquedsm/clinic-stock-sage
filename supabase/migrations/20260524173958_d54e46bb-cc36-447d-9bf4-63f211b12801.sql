
CREATE TABLE public.medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  principio_ativo TEXT,
  fabricante TEXT,
  numero_lote TEXT NOT NULL,
  categoria TEXT,
  apresentacao TEXT,
  concentracao TEXT,
  quantidade_atual INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 10,
  data_fabricacao DATE,
  data_validade DATE NOT NULL,
  localizacao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID NOT NULL REFERENCES public.medicamentos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  motivo TEXT,
  responsavel TEXT,
  data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacoes TEXT
);

CREATE TABLE public.alertas_configuracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dias_aviso_vencimento INTEGER NOT NULL DEFAULT 30,
  quantidade_minima_global INTEGER NOT NULL DEFAULT 10
);

INSERT INTO public.alertas_configuracao (dias_aviso_vencimento, quantidade_minima_global)
VALUES (30, 10);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER medicamentos_set_updated_at
BEFORE UPDATE ON public.medicamentos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_configuracao ENABLE ROW LEVEL SECURITY;

-- Policies (authenticated users full access)
CREATE POLICY "auth_all_medicamentos" ON public.medicamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_movimentacoes" ON public.movimentacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_alertas" ON public.alertas_configuracao FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_medicamentos_data_validade ON public.medicamentos(data_validade);
CREATE INDEX idx_movimentacoes_medicamento_id ON public.movimentacoes(medicamento_id);
CREATE INDEX idx_movimentacoes_data ON public.movimentacoes(data_movimentacao DESC);
