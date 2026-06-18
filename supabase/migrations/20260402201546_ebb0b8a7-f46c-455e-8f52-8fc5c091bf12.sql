
CREATE TABLE public.manutencoes_equipamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.manutencoes_equipamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to manutencoes_equipamento"
ON public.manutencoes_equipamento
FOR ALL
TO public
USING (true)
WITH CHECK (true);
