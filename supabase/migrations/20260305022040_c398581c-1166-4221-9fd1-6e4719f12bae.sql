
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS data_desmama date;
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS data_confinamento date;
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS preco_compra numeric DEFAULT 0;
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS preco_venda numeric DEFAULT 0;
