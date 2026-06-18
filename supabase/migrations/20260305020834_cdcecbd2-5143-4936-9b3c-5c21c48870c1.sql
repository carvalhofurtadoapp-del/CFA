
-- Animais table
CREATE TABLE public.animais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brinco TEXT NOT NULL,
  nome TEXT,
  raca TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  pai TEXT,
  mae TEXT,
  foto TEXT,
  sexo TEXT NOT NULL DEFAULT 'macho',
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pesagens table
CREATE TABLE public.pesagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animais(id) ON DELETE CASCADE NOT NULL,
  peso NUMERIC NOT NULL,
  data DATE NOT NULL,
  gmd NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gastos table
CREATE TABLE public.gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'saida',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vacinas table
CREATE TABLE public.vacinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animais(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  data_aplicacao DATE,
  data_proxima DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insumos table
CREATE TABLE public.insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL,
  codigo_barras TEXT,
  codigo_ean TEXT,
  minimo NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Movimentacoes de estoque table
CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id UUID REFERENCES public.insumos(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'entrada',
  quantidade NUMERIC NOT NULL,
  data DATE NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Historico table
CREATE TABLE public.historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data DATE NOT NULL,
  detalhes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.animais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;

-- Allow public access (anon) for all tables since no auth is implemented yet
CREATE POLICY "Allow all access to animais" ON public.animais FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pesagens" ON public.pesagens FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to gastos" ON public.gastos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to vacinas" ON public.vacinas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to insumos" ON public.insumos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to movimentacoes_estoque" ON public.movimentacoes_estoque FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to historico" ON public.historico FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
