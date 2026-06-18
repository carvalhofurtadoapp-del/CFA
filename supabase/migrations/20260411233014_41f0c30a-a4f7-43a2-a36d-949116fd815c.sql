
ALTER TABLE public.animais
ADD COLUMN mojando boolean NOT NULL DEFAULT false,
ADD COLUMN mojando_meses numeric DEFAULT 0,
ADD COLUMN mojando_data_inicio date DEFAULT NULL,
ADD COLUMN observacao text DEFAULT NULL;
