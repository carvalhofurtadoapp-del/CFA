
CREATE TABLE public.lotes_rebanho (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.lotes_rebanho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to lotes_rebanho"
ON public.lotes_rebanho
FOR ALL
TO public
USING (true)
WITH CHECK (true);

ALTER TABLE public.animais ADD COLUMN lote_rebanho_id uuid REFERENCES public.lotes_rebanho(id) ON DELETE SET NULL;
