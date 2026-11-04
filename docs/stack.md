# Softwares, plataformas e bibliotecas

## Plataformas e serviços

| Serviço | Para quê | Onde configurar |
|---|---|---|
| **Supabase** (Postgres) | Banco de dados. App usa o *transaction pooler* (porta 6543); migrações usam o *session pooler* (porta 5432, IPv4) | `DATABASE_URL`, `DATABASE_URL_DIRECT` |
| **Google Cloud** (OAuth) | Login com Google. Cliente "Aplicativo da Web" com o redirecionamento `<APP_BASE_URL>/api/auth/callback/google` | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| **Cloudflare R2** | Fotos (bucket público) e CNHs (bucket privado), pela API S3 | `R2_*` |
| **Cloudflare Workers** (Cron Trigger) | Chama a limpeza de CNHs (código no `README.md` da raiz) | `CRON_SECRET` |
| **Resend** | Envio dos e-mails de confirmação e de redefinição de senha (API por `fetch`, sem SDK). Domínio verificado: `77mdevseven.tech` (DNS na Cloudflare, região São Paulo); remetente `nao-responda@77mdevseven.tech` | `RESEND_API_KEY`, `EMAIL_FROM` |
| **Asaas** | Cobrança da assinatura (Sandbox em teste, produção depois). Contas e chaves separadas por ambiente | `ASAAS_*` |
| **Criptenv** | Cofre dos segredos (zero-knowledge, AES-256-GCM no cliente). CLI `criptenv` 0.2.3 (Python) na máquina e na imagem | [segredos.md](segredos.md) |
| **Docker** | Imagem do app (`Dockerfile`, `compose.yaml`), build sem segredos, `output: "standalone"` do Next | `CRIPTENV_PROJECT`, `CRIPTENV_ENV` |
| **ngrok** | Túnel HTTPS em desenvolvimento, com domínio fixo, para o webhook do Asaas e o login do Google | `~/.config/ngrok/ngrok.yml` |
| **GitHub** | Repositório `77mdias/autogiro`, branch `main` | — |
| **Stitch** (Google) | Projeto "AutoGiro PWA Platform": referência das telas | — |

Hospedagem de produção: **Vercel** (deploy pela integração com o GitHub, migrações no build; [deploy.md](deploy.md)). Banco de produção num projeto Supabase separado do de dev. O cron continua num Cloudflare Worker.

## Ferramentas locais

- **Node.js 24** (roda `.mts` direto, `process.loadEnvFile`) e **pnpm 11** (`packageManager`). Os scripts também rodam com `npm run`.
- **ngrok v3** em `~/.local/bin/ngrok`.
- **Postgres local** (opcional, para testes de ponta a ponta sem tocar no Supabase).

## Bibliotecas

| Biblioteca | Versão | Uso |
|---|---|---|
| `next` | 16.4.3 | Framework (App Router, Cache Components, `proxy.ts`, Turbopack) |
| `react`, `react-dom` | 19.3.0 | UI |
| `next-auth` | 5.0.0-beta.32 | Auth.js v5 com Google, sessão JWT |
| `drizzle-orm` / `drizzle-kit` | 0.45 / 0.31 | ORM tipado e geração de migrações SQL |
| `postgres` | 4 | Driver do Postgres (postgres.js), usado pelo Drizzle e pelo `scripts/loja.mts` |
| `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | 3 | R2 (upload, delete, URL assinada) |
| `zod` | 4 | Validação de formulários e entradas |
| `tailwindcss`, `@tailwindcss/turbopack` | 4 | Estilos, com tokens em `tokens.css` |
| `shadcn`, `@base-ui/react`, `class-variance-authority`, `tw-animate-css` | — | Componentes base (botão, input, diálogo) |
| `lucide-react` | 1 | Ícones |
| `server-only` | — | Impede importar código de servidor no cliente |
| `typescript`, `eslint`, `eslint-config-next` | 5 / 9 | Tipos e lint |

Senhas usam `scrypt` e tokens `randomBytes`/`sha256`, todos do `node:crypto`. Testes usam o `node --test` nativo, sem biblioteca extra. O Asaas é chamado com `fetch` puro (`src/lib/asaas.ts`), sem SDK.
