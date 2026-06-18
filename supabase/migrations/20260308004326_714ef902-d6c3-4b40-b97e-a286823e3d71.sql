
CREATE TABLE public.app_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  login text NOT NULL UNIQUE,
  senha text NOT NULL,
  role text NOT NULL DEFAULT 'colaborador',
  foto text,
  abas_permitidas text[] DEFAULT ARRAY['dashboard','rebanho'],
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to app_usuarios" ON public.app_usuarios FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.app_usuarios (nome, login, senha, role, abas_permitidas) VALUES
  ('Colaborador', 'colaborador', 'colaborador', 'colaborador', ARRAY['dashboard','rebanho','nutricao','lavoura']),
  ('Veterinária', 'veterinaria', 'V123', 'veterinaria', ARRAY['dashboard','rebanho','veterinaria']),
  ('Gestor', 'gestor', '123', 'gestor', ARRAY['dashboard','rebanho','confinamento','nutricao','lavoura','financeiro','veterinaria','deposito','equipamentos','relatorios','funcionarios','configuracoes']);

CREATE TABLE public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to app_config" ON public.app_config FOR ALL USING (true) WITH CHECK (true);
