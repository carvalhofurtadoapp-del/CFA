
-- 1. Tabela de Funcionários
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL DEFAULT 'geral',
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT NOT NULL DEFAULT 'mensal',
  valor_pagamento NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to funcionarios" ON public.funcionarios FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabela de dias trabalhados dos funcionários
CREATE TABLE public.dias_trabalhados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horas NUMERIC NOT NULL DEFAULT 8,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.dias_trabalhados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to dias_trabalhados" ON public.dias_trabalhados FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabela de tratamentos veterinários
CREATE TABLE public.tratamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'tratamento',
  descricao TEXT NOT NULL,
  diagnostico TEXT,
  medicamento TEXT,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  custo NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tratamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to tratamentos" ON public.tratamentos FOR ALL USING (true) WITH CHECK (true);

-- 4. Adicionar campos de custo à tabela talhoes
ALTER TABLE public.talhoes ADD COLUMN IF NOT EXISTS custo_sementes NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.talhoes ADD COLUMN IF NOT EXISTS custo_fertilizantes NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.talhoes ADD COLUMN IF NOT EXISTS custo_defensivos NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.talhoes ADD COLUMN IF NOT EXISTS custo_mao_obra NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.talhoes ADD COLUMN IF NOT EXISTS custo_maquinas NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.talhoes ADD COLUMN IF NOT EXISTS producao_real NUMERIC;
ALTER TABLE public.talhoes ADD COLUMN IF NOT EXISTS valor_venda_producao NUMERIC;
ALTER TABLE public.talhoes ADD COLUMN IF NOT EXISTS unidade_producao TEXT DEFAULT 'sacas';

-- 5. Adicionar campos ao insumos
ALTER TABLE public.insumos ADD COLUMN IF NOT EXISTS fornecedor TEXT;
ALTER TABLE public.insumos ADD COLUMN IF NOT EXISTS preco_compra NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.insumos ADD COLUMN IF NOT EXISTS quantidade_por_embalagem NUMERIC;
ALTER TABLE public.insumos ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'geral';
