
ALTER TABLE public.equipamentos ADD COLUMN horas_trabalhadas numeric NOT NULL DEFAULT 0;

CREATE TABLE public.sessoes_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fim TIMESTAMP WITH TIME ZONE,
  duracao_minutos numeric DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sessoes_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to sessoes_servico"
ON public.sessoes_servico
FOR ALL
TO public
USING (true)
WITH CHECK (true);
