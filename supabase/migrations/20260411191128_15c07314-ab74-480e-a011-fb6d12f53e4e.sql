-- Add categoria_animal and status to dietas
ALTER TABLE public.dietas
  ADD COLUMN IF NOT EXISTS categoria_animal text NOT NULL DEFAULT 'engorda',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';

-- Add sobras to consumo_racao
ALTER TABLE public.consumo_racao
  ADD COLUMN IF NOT EXISTS sobras numeric NOT NULL DEFAULT 0;