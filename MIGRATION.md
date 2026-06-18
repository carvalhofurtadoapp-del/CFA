# Migração para Vercel + Supabase

Este projeto agora está pronto para rodar fora do Lovable, usando **Vercel** no
frontend e **Supabase** no backend (mesma infra já utilizada).

## 1. Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com) com o projeto já criado
  (ref atual: `dpqctyaigkhvbxoiovki`)
- Repositório Git (GitHub/GitLab/Bitbucket) com o código

## 2. Variáveis de ambiente (Vercel → Project Settings → Environment Variables)

Frontend (build-time, expostas no cliente — usar prefixo `VITE_`):

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://<PROJECT_REF>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key do Supabase |
| `VITE_SUPABASE_PROJECT_ID` | `<PROJECT_REF>` |

Veja `.env.example` na raiz do repo.

## 3. Variáveis de ambiente do backend (Supabase → Edge Functions → Secrets)

As Edge Functions (`supabase/functions/*`) já existem no projeto Supabase. Os
segredos abaixo precisam estar configurados lá (não na Vercel):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (ex: `mailto:admin@exemplo.com`)
- `LOVABLE_API_KEY` *(opcional — só se mantiver o gateway de IA da Lovable)*

## 4. Onde o app depende do backend

Toda comunicação com o backend passa pelo client Supabase em:

- `src/integrations/supabase/client.ts` — instancia o `@supabase/supabase-js`
  usando as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `src/hooks/use*.ts` — hooks React Query que fazem `supabase.from(...)`,
  `.select/.insert/.update/.delete`.
- `src/contexts/AuthContext.tsx` — login customizado lendo `app_usuarios`.
- `src/components/PushNotificationButton.tsx` + `src/hooks/usePushNotifications.ts`
  — gravam em `push_subscriptions` e chamam a Edge Function
  `send-push-notifications`.
- `supabase/functions/send-push-notifications/index.ts` — única Edge Function
  do projeto. Continua hospedada no Supabase.
- `supabase/migrations/` — histórico de schema. Aplicar via Supabase CLI
  (`supabase db push`) caso queira recriar em outro projeto.

## 5. Deploy na Vercel

1. `New Project` → importe o repositório Git.
2. Framework Preset: **Vite** (detectado automaticamente).
3. Build Command: `vite build` · Output: `dist` (já no `vercel.json`).
4. Adicione as variáveis `VITE_*` em **Environment Variables**.
5. Deploy.

O arquivo `vercel.json` já configura SPA fallback (todas as rotas
`react-router-dom` funcionam em refresh/deep link).

## 6. O que foi removido / ajustado

- `lovable-tagger` removido de `package.json` e `vite.config.ts`.
- `capacitor.config.ts`: removida a URL `lovableproject.com` do bloco
  `server` (Capacitor agora carrega o bundle local de `dist`).
- `index.html`: removidas tags OG/Twitter que apontavam para CDN do Lovable
  e `meta name="author" content="Lovable"`.
- Adicionados `vercel.json` e `.env.example`.

## 7. O que **não** foi alterado

- Schema do banco, RLS, dados, lógica de hooks, telas, autenticação custom.
- O client Supabase (`src/integrations/supabase/client.ts`) continua
  funcionando — apenas passa a ler `import.meta.env.VITE_*` da Vercel.
- A pasta `supabase/` (migrations, config.toml e edge function) permanece
  intacta para uso com Supabase CLI.

## 8. Migrar para um Supabase próprio (opcional)

Se quiser sair do projeto Supabase atual:

```bash
npx supabase link --project-ref <NOVO_REF>
npx supabase db push          # aplica todas as migrations
npx supabase functions deploy send-push-notifications
```

Depois atualize as `VITE_SUPABASE_*` na Vercel para o novo projeto e
reconfigure os secrets do passo 3 no novo dashboard Supabase.