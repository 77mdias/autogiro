# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

AutoGiro: mobile-first PWA for used-car dealers ("garagistas"): inventory, public storefront per store, and financing-simulation leads with CNH (driver's license) upload. Stores pay R$ 149/month via Asaas, 7-day free trial. Code, UI copy, and docs are in Portuguese; keep it that way.

Full docs live in `docs/` (architecture, stack, decisions log, Asaas payments, dev setup and known pitfalls, secrets, tests). Read the relevant file before changing payments, auth, or infra. `DESIGN.md` is the locked visual system.

## Commands

Package manager is pnpm.

```bash
pnpm dev                       # next dev (pnpm dev:criptenv to load secrets from Criptenv instead of .env.local)
pnpm build
pnpm lint                      # eslint
pnpm test                      # node --test src/**/*.test.ts (native Node TS stripping, no test framework)
node --test src/lib/plano.test.ts   # single test file
npx tsc --noEmit               # typecheck
pnpm db:generate               # migration from src/lib/db/schema.ts (interactive on column renames)
pnpm db:migrate                # apply drizzle/*.sql (uses DATABASE_URL_DIRECT = Supabase session pooler)
pnpm loja -- listar | liberar <slug> [cus_...] | pausar <slug>   # manual plan ops (scripts/loja.mts)
pnpm tunnel -- --url=<domain>  # ngrok, needed for Asaas webhooks and Google OAuth in dev
```

Before committing: `pnpm test`, `npx tsc --noEmit`, `pnpm lint`.

Tests run under plain `node --test`, so tested files in `src/lib/` must not use the `@/` alias and import siblings with explicit `.ts` extensions. Keep logic worth testing in those pure modules (`plano.ts`, `signature.ts`, `senha.ts`, `masks.ts`, `utils.ts`).

## Architecture

Next.js 16 App Router with `cacheComponents: true`, `output: "standalone"` (Docker), Tailwind v4 + shadcn (`@base-ui/react`), Drizzle on Supabase Postgres, Auth.js v5 (Google + email/password credentials, JWT sessions), Cloudflare R2, Asaas, Resend.

**Multi-tenant isolation (the central invariant).**
- Every store-owned table has `loja_id` → `lojas.id` with `on delete cascade`.
- In authenticated code, `loja_id` comes **only** from `getLojaId()` / `requireLojaId()` in `src/lib/session.ts`, and goes into every `where`. Never accept it from params, query, or body.
- In public routes (`/loja/[slug]`, `POST /api/simulacoes`), derive `loja_id` from the resource (e.g. the car), never from the client.
- RLS is enabled with no policies on all tables (`.enableRLS()` in schema), so Supabase's REST API reads nothing; the app uses the server role via Drizzle only.

**Auth flow.** `src/proxy.ts` (Next 16's replacement for middleware) is an optimistic gate on `/painel` and `/onboarding`; real checks happen per page via `requireLojaId()`, which redirects: no session → `/login`, no store → `/onboarding`, plan blocked → `/painel/loja`. A store links to a user by `lojas.auth_user_id = token.sub` (Google sub or `usuarios.id`). The `jwt` callback in `src/lib/auth.ts` keeps looking up `loja_id` until one exists, so onboarding works without re-login. Email accounts (`usuarios`, `tokens_email`) store only scrypt hashes and sha256 of email tokens.

**Plan/billing.** `planoLiberado()` in `src/lib/plano.ts` is the single decision for whether the panel, the storefront, and new simulations are allowed. Plan status is driven by the Asaas webhook (`src/app/api/webhooks/asaas`): token checked in constant time, idempotent via `webhook_events (provider, event_key)` unique index; only subscription charges change the plan. `ASAAS_CHECKOUT` empty = phase 1 (assisted sale, manual `pnpm loja -- liberar`); `on` = phase 2 (card self-checkout). Details in `docs/pagamentos-asaas.md`.

**Files (R2).** Car photos: public bucket, resized client-side before upload (server action body limit 12 MB). CNH: private bucket, served only to the store owner through `GET /api/simulacoes/[id]/cnh` as a 5-minute signed URL; `POST /api/cron/delete-expired-cnh` (Bearer `CRON_SECRET`, called by a Cloudflare Worker) deletes them for LGPD.

**Mutations** are server actions in `src/app/painel/actions.ts`, all scoped by `loja_id`.

## Gotchas

- Cache Components: auth reads go through `getSession()`, which calls `connection()` first; each panel page needs its own `loading.tsx`, or you get "uncached data during prerendering".
- `ASAAS_API_KEY` starts with `$`: escape it as `\$aact_...` in `.env.local`.
- Supabase direct connection is IPv6-only; migrations use the session pooler.
- Design: new type-scale sizes must be registered in `src/lib/utils.ts`, or `cn` will treat them as colors. Tokens are in `src/app/tokens.css`, wired to shadcn in `globals.css`. Lint design with `node ~/.claude/skills/hallmark/scripts/sloplint.mjs src/app src/components --scope app`.
- In dev, open the app through the ngrok domain (the login cookie is set there) and set `AUTH_URL` to it.
