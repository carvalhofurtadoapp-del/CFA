
-- Confinamento: lotes de confinamento
CREATE TABLE public.lotes_confinamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  previsao_saida date,
  racao_insumo_id uuid REFERENCES public.insumos(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lotes_confinamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to lotes_confinamento" ON public.lotes_confinamento FOR ALL USING (true) WITH CHECK (true);

-- Animais confinados: relação animal <-> lote
CREATE TABLE public.animais_confinamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  lote_id uuid NOT NULL REFERENCES public.lotes_confinamento(id) ON DELETE CASCADE,
  data_entrada date NOT NULL DEFAULT CURRENT_DATE,
  peso_entrada numeric NOT NULL,
  previsao_saida date,
  data_saida date,
  peso_saida numeric,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  UNIQUE(animal_id, lote_id)
);

ALTER TABLE public.animais_confinamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to animais_confinamento" ON public.animais_confinamento FOR ALL USING (true) WITH CHECK (true);

-- Consumo de ração por lote (baixa no estoque)
CREATE TABLE public.consumo_racao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes_confinamento(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantidade numeric NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.consumo_racao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to consumo_racao" ON public.consumo_racao FOR ALL USING (true) WITH CHECK (true);
