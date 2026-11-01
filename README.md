# Garagem Link

PWA mobile-first para garagistas: estoque, vitrine pública e simulações de financiamento.

Next.js 16 (App Router, `proxy.ts`, Cache Components) · TypeScript · Tailwind v4 · shadcn/ui · Drizzle + Supabase Postgres · Auth.js (Google) · Cloudflare R2.

## Setup

```bash
cp .env.example .env.local   # preencha os valores
pnpm install
pnpm db:migrate              # aplica drizzle/*.sql no Supabase (usa DATABASE_URL_DIRECT = session pooler, porta 5432; a conexão direta db.<ref>.supabase.co é só IPv6)
pnpm dev
pnpm test                    # testes de assinatura/token
```

Alterou `src/lib/db/schema.ts`? `pnpm db:generate` e depois `pnpm db:migrate`.

## Estrutura

```
src/
  proxy.ts                       barreira de login em /painel e /onboarding
  lib/
    db/schema.ts                 lojas, carros, simulacoes_financiamento, webhook_events
    auth.ts                      Auth.js (Google, sessão JWT); loja_id no token (callback jwt)
    session.ts                   getLojaId / requireLojaId — única fonte de loja_id
    r2.ts                        bucket público (fotos) e privado (CNH, URL assinada 5 min)
    signature.ts                 HMAC e Bearer em tempo constante (node:crypto)
  app/
    loja/[slug]/                          vitrine pública (vendidos com sobreposição)
    loja/[slug]/carros/[carroId]/         detalhe + barra fixa WhatsApp / Simular
    loja/[slug]/carros/[carroId]/simular  formulário de simulação (LGPD + CNH)
    onboarding/                           criação da loja no primeiro login
    painel/estoque                        dashboard: carros, copiar link, novas simulações
    painel/estoque/{novo,[id]}            cadastro/edição de carro
    painel/interessados                   leads: Ver CNH, WhatsApp, Excluir
    painel/loja                           nome + WhatsApp da loja
    painel/actions.ts                     server actions (todas escopadas por loja_id)
    api/simulacoes                        POST público (lead + CNH)
    api/simulacoes/[id]/cnh               GET dono da loja → redirect p/ URL assinada (5 min)
    api/webhooks/appmax                   webhook com HMAC + idempotência
    api/cron/delete-expired-cnh           limpeza LGPD (Bearer CRON_SECRET)
  components/                             bottom-nav, masked-input, pill-group, loja-form…
```

## Design

Tokens em `src/app/globals.css` a partir do `DESIGN.md`: canvas branco, tinta preta, cards `#f0fdfa`, Inter, raio 8px (inputs, opções) / 12px (botões, cards) / 16px (modais), escala tipográfica como utilitários (`text-display-md`, `text-sub-lg`, `text-body-md`, `text-caption`…).

Desvios intencionais por acessibilidade (WCAG AA):
- CTAs usam `#0b7a72` (5.2:1); `#0e9389` (`--brand`) fica para acentos (anel de foco, bordas). Branco sobre `#0e9389` dá 3.78:1.
- `body`/`mute` do DESIGN.md (`#d6d6d6`/`#a3a3a3`) só como borda; texto secundário em `#525252`.
- Botões com 48px de altura e inputs com 16px de fonte (evita zoom no iOS), acima do padding/tamanho do DESIGN.md.

Ao usar um tamanho novo da escala, registre-o em `src/lib/utils.ts` (senão o `cn` o confunde com cor).

## Regras de isolamento (multi-tenant)

- Toda tabela de dados da loja tem `loja_id` (FK `lojas.id`, `on delete cascade`).
- Em código autenticado, `loja_id` vem **só** de `getLojaId()`/`requireLojaId()` e entra em todo `where`.
- Em rotas públicas, `loja_id` é derivado do recurso (ex.: do carro), nunca do cliente.
- RLS ligado em todas as tabelas sem policies: a API REST do Supabase (anon key) não lê nada; o app usa a role do servidor via Drizzle.

## Integrações externas

- **Auth.js (Google)**: crie um ID do cliente OAuth (Aplicativo da Web) no Google Cloud com o redirecionamento `<APP_BASE_URL>/api/auth/callback/google` e preencha `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`/`AUTH_SECRET`. A loja é ligada ao usuário por `lojas.auth_user_id = sub` do Google.
- **R2**: dois buckets. `R2_PUBLIC_BUCKET` com domínio público; `R2_PRIVATE_BUCKET` **sem** acesso público.
- **Cron (Cloudflare Worker)**:
  ```js
  export default {
    async scheduled(_e, env) {
      await fetch("https://<app>/api/cron/delete-expired-cnh", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      });
    },
  };
  ```
