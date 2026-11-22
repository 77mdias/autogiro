# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

AutoGiro: mobile-first PWA for used-car dealers ("garagistas"): inventory, public storefront per store, and financing-simulation leads with CNH (driver's license) upload. Stores pay a monthly fee via Asaas by team size (R$ 59 to R$ 169, `valorPlano()` in `src/lib/plano.ts`), 15-day free trial. Code, UI copy, and docs are in Portuguese; keep it that way.

Full docs live in `docs/`, indexed in `docs/README.md`. Start with `docs/produto/estado.md` (what is done, what differs from the PRD/SRS and why, what is missing); product specs are in `docs/produto/`. Read the relevant file before changing payments, auth, or infra. **Docs change in the same PR as the code**: the "Manter em dia" table in `docs/README.md` says which file each kind of change updates. `DESIGN.md` is the locked visual system.

## Commands

Package manager is pnpm.

```bash
pnpm docker:up                 # dev container on :3000: migrations, then vite dev (vinext in workerd) + Compose Watch hot reload, secrets from Criptenv (keyring)
pnpm docker:exec <cmd>         # run <cmd> inside the dev container with the secrets, e.g. pnpm docker:exec pnpm db:migrate
pnpm build                     # vite build of the Worker (no secrets); pnpm docker:exec pnpm preview runs the built Worker
pnpm lint                      # eslint
pnpm test                      # node --test src/**/*.test.ts (native Node TS stripping, no test framework)
node --test src/lib/plano.test.ts   # single test file
pnpm typecheck                 # next typegen (route types) + cf workers types (Worker env types) + tsc --noEmit, no secrets
pnpm db:generate                    # migration from src/lib/db/schema.ts, on the host: no DB, no secrets (interactive on column renames)
pnpm docker:exec pnpm db:migrate    # apply drizzle/*.sql (uses DATABASE_URL_DIRECT = Supabase session pooler)
pnpm docker:exec pnpm loja listar | liberar <slug> [cus_...] | pausar <slug> | mensalidades [aplicar]   # manual plan ops (scripts/loja.mts), dev DB
pnpm loja:prod listar | liberar <slug> [cus_...] | ...   # same ops on the production DB (one-off container, keyring item api-key-production)
pnpm tunnel -- --url=<domain>  # ngrok, needed for Asaas webhooks and Google OAuth in dev
```

Before committing: `pnpm test`, `pnpm typecheck`, `pnpm lint`.

**Git flow:** work on a branch, open a PR; GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, tests, build and a pending-migration check. Merging into `main` makes the same workflow apply pending migrations and then deploy the Cloudflare Worker (`pnpm run deploy`; plain `pnpm deploy` is a different pnpm command). No PR previews yet. Never commit straight to `main`. Details in `docs/deploy.md`.

**Migrations are automatic:** after `pnpm db:generate` (on the host), the dev container restarts and applies them on startup (`pnpm db:migrate` in the Dockerfile CMD). Production applies them in GitHub Actions before the deploy. Dropping or renaming a column takes two deploys (the code stops using it first).

**The app only runs in Docker, with secrets from Criptenv. Never create a `.env`/`.env.local`/`.dev.vars` or start `vite dev` (or `next dev`) on the host** (plaintext secrets on disk are what the Criptenv setup removed; see `docs/segredos.md`). Tests, typecheck and lint run on the host and need no secrets. Anything that needs secrets goes through `pnpm docker:exec`.

Tests run under plain `node --test`, so tested files in `src/lib/` must not use the `@/` alias and import siblings with explicit `.ts` extensions. Keep logic worth testing in those pure modules (`plano.ts`, `signature.ts`, `senha.ts`, `masks.ts`, `utils.ts`, `erro.ts`).

## Architecture

Next.js 16 App Router code run by **vinext** (Cloudflare's reimplementation of the Next API on Vite) in a **Cloudflare Worker** (`cloudflare.config.ts`, entry `worker/index.ts`); `next` is installed only for types and `next typegen`. No Cache Components: every page renders per request. Tailwind v4 (PostCSS) + shadcn (`@base-ui/react`), Drizzle on Supabase Postgres through Hyperdrive, Better Auth (Google + email/password, database sessions), Cloudflare R2, Cloudflare Images for `next/image`, Asaas, Resend.

**Database per request.** A Worker cannot reuse a connection across requests. `worker/index.ts` opens a per-request scope (`pedidoDb`, AsyncLocalStorage) with the Hyperdrive URL, and `db` from `src/lib/db` resolves the client of the current request. Always import `db`; never create a module-level `postgres()` client. Outside the Worker (scripts, migrations) `db` falls back to one client from `DATABASE_URL`.

**Multi-tenant isolation (the central invariant).**
- Every store-owned table has `loja_id` → `lojas.id` with `on delete cascade`.
- In authenticated code, `loja_id` comes **only** from `getLojaId()` / `requireLojaId()` in `src/lib/session.ts`, and goes into every `where`. Never accept it from params, query, or body.
- In public routes (`/loja/[slug]`, `POST /api/simulacoes`), derive `loja_id` from the resource (e.g. the car), never from the client.
- RLS is enabled with no policies on all tables (`.enableRLS()` in schema), so Supabase's REST API reads nothing; the app uses the server role via Drizzle only.

**Auth flow.** `src/proxy.ts` (Next 16's replacement for middleware) is an optimistic gate on `/painel`, `/admin` and `/onboarding` and also refreshes the session cookie (pages cannot set cookies while rendering); real checks happen per page via `requireLojaId()`, which redirects: no session → `/login`, no store → `/onboarding`, plan blocked → `/painel/loja`. Better Auth (`src/lib/auth.ts`) uses tables `usuarios` (user), `logins` (account), `sessoes`, `verificacoes`. A user links to a store through `membros.auth_user_id = usuarios.id`, with `papel` `gestor | vendedor`; the store creator is the gestor. `getSession()` in `src/lib/session.ts` reads the Better Auth session and looks up the active member on every request (so onboarding works without re-login and deactivation is immediate), returning `user.{id, email, loja_id, membro_id, papel}`. Gestor-only actions use `getLojaIdDoGestor()`; gestor-only pages pass `{ soGestor: true }` to `requireLojaId()`. Email signup, confirmation and password reset are ours (`login/actions.ts`, `lib/conta.ts`, `tokens_email` with sha256 tokens); Better Auth only checks the password (scrypt from `lib/senha.ts`, `credential` row in `logins`) and opens the session. Pre-Better-Auth Google accounts still have the Google `sub` in `auth_user_id`; `adotarContaGoogle` re-links them on first login.

**Plan/billing.** `planoLiberado()` in `src/lib/plano.ts` is the single decision for whether the panel, the storefront, and new simulations are allowed. Plan status is driven by the Asaas webhook (`src/app/api/webhooks/asaas`): token checked in constant time, idempotent via `webhook_events (provider, event_key)` unique index; only subscription charges change the plan. `ASAAS_CHECKOUT` `off` (anything but `on`) = phase 1 (assisted sale, manual `pnpm loja -- liberar`); `on` = phase 2 (card self-checkout). Details in `docs/pagamentos-asaas.md`.

**Files (R2).** Car photos: public bucket, resized client-side before upload (server action body limit 12 MB). CNH: private bucket, served only to the store owner through `GET /api/simulacoes/[id]/cnh` as a 5-minute signed URL; the Worker's own daily cron (`scheduled` in `worker/index.ts` → `src/lib/limpeza-cnh.ts`) deletes them after 90 days for LGPD.

**Mutations** are server actions in `src/app/painel/actions.ts`, all scoped by `loja_id`.

## Gotchas

- Worker secrets are the `segredos` list in `cloudflare.config.ts`: add a new env var there and in Criptenv, or the Worker never sees it. `HYPERDRIVE_ID` there must be the real id for deploys.
- `res.json()` is typed `{}`-ish by the Workers types: cast the result (`as { ... }`).
- Never read the clock at module scope (`const ano = new Date().getFullYear()` outside a function): in the Worker the clock is frozen at 1970 while the module loads. Read it inside the handler, action or validator.
- `ASAAS_API_KEY` starts with `$`: in Criptenv store the raw value (`criptenv set 'ASAAS_API_KEY=$aact_...'`, single quotes).
- Supabase direct connection is IPv6-only; migrations use the session pooler.
- `postgres` is pinned to 3.4.9: 4.x pipelines queries beyond `max` and through Hyperdrive they never answer (porsager/postgres#1319). `prepare` is off only on the dev transaction pooler (port 6543); Hyperdrive needs it on. Hyperdrive points at the Supabase direct connection.
- Design: new type-scale sizes must be registered in `src/lib/utils.ts`, or `cn` will treat them as colors. Tokens are in `src/app/tokens.css`, wired to shadcn in `globals.css`. Lint design with `node ~/.claude/skills/hallmark/scripts/sloplint.mjs src/app src/components --scope app`.
- In dev, open the app through the ngrok domain and set `AUTH_URL` to it: Better Auth rejects POSTs whose origin is not `AUTH_URL`.
