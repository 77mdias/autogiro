# Desenvolvimento

## Setup

```bash
cp .env.example .env.local   # preencha (lista comentada no próprio arquivo)
pnpm install
pnpm db:migrate              # aplica drizzle/*.sql no Supabase (DATABASE_URL_DIRECT)
pnpm dev                     # http://localhost:3000
```

Sem `.env.local`: com o Criptenv configurado ([segredos.md](segredos.md)), use `pnpm dev:criptenv` ou `pnpm docker:up`.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` / `build` / `start` | Next |
| `pnpm dev:criptenv` | `next dev` com os segredos do ambiente `development` do Criptenv |
| `pnpm docker:up` | Imagem e container com os segredos do Criptenv (credenciais do chaveiro) |
| `pnpm lint` | ESLint |
| `pnpm test` | `node --test` em `src/**/*.test.ts` |
| `pnpm db:generate` | Gera migração a partir do `schema.ts` |
| `pnpm db:migrate` | Aplica as migrações |
| `pnpm loja -- listar \| liberar <slug> [cus_...] \| pausar <slug>` | Operação manual do plano (fase 1) |
| `pnpm tunnel -- --url=<dominio>` | ngrok para a porta 3000 |

## Variáveis de ambiente

Todas listadas e comentadas em `.env.example`. As que mudam entre ambientes:

| Variável | Dev (ngrok) | Produção |
|---|---|---|
| `APP_BASE_URL` | `https://<dominio>.ngrok-free.dev` (com `https://`, sem barra no fim) | domínio final |
| `AUTH_URL` | igual ao `APP_BASE_URL` | opcional |
| `ASAAS_API_URL` | Sandbox | produção |
| `ASAAS_CHECKOUT` | `on` para testar a fase 2 | vazio na fase 1 |
| `EMAIL_FROM` | `AutoGiro <nao-responda@77mdevseven.tech>` | o mesmo, ou um domínio próprio do AutoGiro quando existir |

## ngrok (túnel em dev)

Instalado em `~/.local/bin/ngrok`, authtoken em `~/.config/ngrok/ngrok.yml`. Domínio fixo atual: `await-creation-manger.ngrok-free.dev`.

1. Terminal 1: `pnpm dev`. Terminal 2: `pnpm tunnel -- --url=await-creation-manger.ngrok-free.dev`.
2. Abra o app **pelo domínio do ngrok** (o cookie do login fica nele).
3. No Google Cloud, o domínio está nas origens JavaScript e o callback `https://<dominio>/api/auth/callback/google` nos redirecionamentos (adicionados, sem apagar os de `localhost`).
4. O webhook do Asaas Sandbox aponta para `https://<dominio>/api/webhooks/asaas`.

`next.config.ts` libera os domínios do ngrok em `allowedDevOrigins`.

## Migrações

Altere `src/lib/db/schema.ts`, rode `pnpm db:generate` (precisa de terminal interativo quando pergunta sobre renomear coluna) e `pnpm db:migrate`. Supabase já tem `0000`, `0001_asaas` e `0002_plano_asaas`; `0003_conta_email` (usuários e tokens de e-mail) ainda precisa ser aplicada.

## Armadilhas conhecidas

- **Chave do Asaas começa com `$`.** No `.env.local` escreva `ASAAS_API_KEY=\$aact_...`; sem a barra, o Next lê `$aact_` como variável e a chave fica vazia ("ASAAS_API_KEY não configurada"). Scripts que usam `process.loadEnvFile` recebem a barra junto e precisam tirá-la.
- **`redirect_uri_mismatch` no Google pelo ngrok.** Faltou `AUTH_URL` com o domínio do ngrok.
- **Erro "uncached data during prerendering or a navigation".** A página do painel precisa do seu próprio `loading.tsx`.
- **`AUTOGIRO_WHATSAPP`** sem `+55`: o app acrescenta o 55.
- **Conexão direta do Supabase** (`db.<ref>.supabase.co`) é só IPv6; use o session pooler nas migrações.

## Git

Branch `main`, remoto `origin` (`github.com/77mdias/autogiro`). `.env*` ignorado, exceto `.env.example`.
