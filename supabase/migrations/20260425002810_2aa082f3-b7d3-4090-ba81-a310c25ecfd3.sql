CREATE TABLE public.assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  dia_desconto INTEGER NOT NULL CHECK (dia_desconto BETWEEN 1 AND 31),
  valor NUMERIC NOT NULL DEFAULT 0,
  icone TEXT DEFAULT '💳',
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to assinaturas"
ON public.assinaturas
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);