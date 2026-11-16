# Softwares, plataformas e bibliotecas

## Plataformas e serviços

| Serviço | Para quê | Onde configurar |
|---|---|---|
| **Supabase** (Postgres) | Banco de dados. Em produção o Worker chega nele pelo Hyperdrive (session pooler); no dev, direto pelo *transaction pooler* (porta 6543); migrações usam o *session pooler* (porta 5432, IPv4) | `DATABASE_URL`, `DATABASE_URL_DIRECT`, `HYPERDRIVE_ID` |
| **Google Cloud** (OAuth) | Login com Google. Cliente "Aplicativo da Web" com o redirecionamento `<APP_BASE_URL>/api/auth/callback/google` | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| **Cloudflare R2** | Fotos (bucket público) e CNHs (bucket privado), pela API S3 | `R2_*` |
| **Cloudflare Workers** (plano Paid) | Hospedagem de produção: o app inteiro num Worker pelo vinext, com cron diário da limpeza de CNHs ([deploy.md](deploy.md)) | `cloudflare.config.ts`; segredos pela integração do Criptenv |
| **Cloudflare Hyperdrive** | Pool de conexões entre o Worker e o Supabase | `HYPERDRIVE_ID` em `cloudflare.config.ts` |
| **Cloudflare Images** | Redimensiona o `next/image` (binding `IMAGES`) | — |
| **Resend** | Envio dos e-mails de confirmação e de redefinição de senha (API por `fetch`, sem SDK). Domínio verificado: `77mdevseven.tech` (DNS na Cloudflare, região São Paulo); remetente `nao-responda@77mdevseven.tech` | `RESEND_API_KEY`, `EMAIL_FROM` |
| **Asaas** | Cobrança da assinatura (Sandbox em teste, produção depois). Contas e chaves separadas por ambiente | `ASAAS_*` |
| **Criptenv** | Cofre dos segredos (zero-knowledge, AES-256-GCM no cliente). CLI `criptenv` (Python) na máquina e na imagem; integração com a Cloudflare para os segredos do Worker | [segredos.md](segredos.md) |
| **Docker** | Dev em container com hot reload (`compose.dev.yaml`, Compose Watch), rodando o Worker no workerd. Produção não usa imagem | `CRIPTENV_PROJECT`, `CRIPTENV_ENV` |
| **ngrok** | Túnel HTTPS em desenvolvimento, com domínio fixo, para o webhook do Asaas e o login do Google | `~/.config/ngrok/ngrok.yml` |
| **GitHub** | Repositório público `77mdias/autogiro`. `main` protegida: só por PR com o CI verde | — |
| **GitHub Actions** | CI de todo PR e push na `main` (lint, tipos, testes, build, migração pendente) e, na `main`, migrações e deploy do Worker (`.github/workflows/ci.yml`) | Secrets do environment `production`: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URL_DIRECT` |
| **Stitch** (Google) | Projeto "AutoGiro PWA Platform": referência das telas | — |

Hospedagem de produção: **Cloudflare Workers** pelo vinext (deploy pelo GitHub Actions, migrações antes do deploy; [deploy.md](deploy.md)). Até 2026-11-16 era a Vercel. Banco de produção num projeto Supabase separado do de dev.

## Ferramentas locais

- **Docker** (Docker Desktop no Linux) e o chaveiro do sistema (`secret-tool`) com as credenciais do Criptenv.
- **Node.js 24** (roda `.mts` e `.ts` direto) e **pnpm 11** (`packageManager`), no host só para editor, testes, lint e tipos.
- **ngrok v3** em `~/.local/bin/ngrok`.
- **Postgres local** (opcional, para testes de ponta a ponta sem tocar no Supabase).

## Bibliotecas

| Biblioteca | Versão | Uso |
|---|---|---|
| `vinext`, `@vinext/cloudflare` | 1.4 / 1.3 | A API do Next.js 16 sobre Vite, rodando no Worker (App Router, server actions, `proxy.ts`, `next/image` pelo Cloudflare Images) |
| `vite`, `@vitejs/plugin-react`, `@vitejs/plugin-rsc`, `@cloudflare/vite-plugin` (v2 beta), `cf` (beta) | — | Build, dev no workerd, tipos do Worker (`cf workers types`) e deploy |
| `next` | 16.4.3 | Só tipos (`Metadata`, `PageProps`) e o `next typegen`; não roda o app |
| `react`, `react-dom` | 19.3.1 | UI |
| `better-auth` | 1.7.25 (exata) | Login com Google e e-mail/senha, sessão no banco; senha com o scrypt de `lib/senha.ts` |
| `drizzle-orm` / `drizzle-kit` | 0.45 / 0.31 | ORM tipado e geração de migrações SQL |
| `postgres` | 4 | Driver do Postgres (postgres.js), usado pelo Drizzle e pelo `scripts/loja.mts` |
| `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | 3 | R2 (upload, delete, URL assinada) |
| `zod` | 4 | Validação de formulários e entradas |
| `tailwindcss`, `@tailwindcss/postcss` | 4 | Estilos, com tokens em `tokens.css` (PostCSS no vite, `postcss.config.mjs`) |
| `shadcn`, `@base-ui/react`, `class-variance-authority`, `tw-animate-css` | — | Componentes base (botão, input, diálogo) |
| `lucide-react` | 1 | Ícones |
| `server-only` | — | Impede importar código de servidor no cliente |
| `typescript`, `eslint`, `eslint-config-next` | 5 / 9 | Tipos e lint |

Senhas usam `scrypt` e tokens `randomBytes`/`sha256`, todos do `node:crypto`. Testes usam o `node --test` nativo, sem biblioteca extra. O Asaas é chamado com `fetch` puro (`src/lib/asaas.ts`), sem SDK.
