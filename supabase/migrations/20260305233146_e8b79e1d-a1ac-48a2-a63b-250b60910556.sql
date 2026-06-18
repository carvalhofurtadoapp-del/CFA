
-- Equipamentos table
CREATE TABLE public.equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'outro',
  valor_compra NUMERIC NOT NULL DEFAULT 0,
  valor_residual NUMERIC NOT NULL DEFAULT 0,
  vida_util_anos INTEGER NOT NULL DEFAULT 10,
  data_compra DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  proxima_manutencao DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to equipamentos" ON public.equipamentos FOR ALL USING (true) WITH CHECK (true);

-- Talhoes table
CREATE TABLE public.talhoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  area_hectares NUMERIC NOT NULL DEFAULT 0,
  cultura TEXT,
  data_plantio DATE,
  previsao_colheita DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.talhoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to talhoes" ON public.talhoes FOR ALL USING (true) WITH CHECK (true);

-- Dietas table
CREATE TABLE public.dietas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  custo_kg NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dietas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to dietas" ON public.dietas FOR ALL USING (true) WITH CHECK (true);

-- Dieta ingredientes
CREATE TABLE public.dieta_ingredientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dieta_id UUID NOT NULL REFERENCES public.dietas(id) ON DELETE CASCADE,
  insumo_id UUID NOT NULL REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantidade_kg NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dieta_ingredientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to dieta_ingredientes" ON public.dieta_ingredientes FOR ALL USING (true) WITH CHECK (true);
