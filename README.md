# AutoGiro

PWA mobile-first para garagistas: estoque, vitrine pública e simulações de financiamento.

Next.js 16 (App Router, `proxy.ts`, Cache Components) · TypeScript · Tailwind v4 · shadcn/ui · Drizzle + Supabase Postgres · Auth.js (Google) · Cloudflare R2.

Documentação completa em [`docs/`](docs/README.md): arquitetura, stack, decisões, pagamentos, desenvolvimento e testes.

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
    signature.ts                 token e Bearer em tempo constante (node:crypto)
    plano.ts                     R$ 149/mês, 7 dias grátis; planoLiberado() decide painel e vitrine
    asaas.ts                     API v3: Checkout de cartão (assinatura mensal) e fatura vencida
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
    api/webhooks/asaas                    webhook Asaas (asaas-access-token + idempotência pelo id do evento)
    api/cron/delete-expired-cnh           limpeza LGPD (Bearer CRON_SECRET)
  components/                             bottom-nav, masked-input, pill-group, loja-form…
```

## Design

O sistema está em `DESIGN.md` (tema Vantage da Hallmark com as cores do logo). Tokens em `src/app/tokens.css`, ligados ao shadcn em `src/app/globals.css`. As telas seguem a organização do projeto "AutoGiro PWA Platform" no Stitch.

- Landing (`/`): versão noturna (`.theme-night`), carro em nuvem de pontos em `src/components/landing/point-car.tsx`, capturas do painel em `public/landing/` (refaça ao mudar as telas).
- Verificação de design: `node ~/.claude/skills/hallmark/scripts/sloplint.mjs src/app src/components --scope app`.
- Ao usar um tamanho novo da escala, registre-o em `src/lib/utils.ts` (senão o `cn` o confunde com cor).

## Plano e pagamento (Asaas)

R$ 149/mês, 7 dias grátis sem cartão (`lojas.trial_ate`). Plano pausado: o painel leva para Minha loja, a vitrine sai do ar e novas simulações são recusadas.

**Fase 1, venda assistida (primeiros 5 a 10 garagistas).** `ASAAS_CHECKOUT` vazio: Minha loja mostra "Falar com a AutoGiro" (`AUTOGIRO_WHATSAPP`).
1. No painel do Asaas, crie a cobrança da loja: link de pagamento ou assinatura mensal com forma de pagamento "Pergunte ao cliente" (Pix, boleto ou cartão).
2. Pago, libere: `npm run loja -- liberar <slug> cus_...` (o `cus_` está em Clientes no Asaas). Sem o `cus_`, a loja fica ativa até você pausar.
3. Com o `cus_` gravado, o webhook assume: cada cobrança que o Asaas gera no mês ativa (paga) ou pausa (vencida) a loja sozinho.
4. `npm run loja -- listar` mostra todas; `npm run loja -- pausar <slug>` pausa.

**Fase 2, autoatendimento.** `ASAAS_CHECKOUT=on`: "Assinar com cartão" abre o Checkout do Asaas; a primeira cobrança cai no fim do teste e o webhook liga a loja pelo `checkoutSession` da assinatura.

**Webhook** (Integrações › Webhooks no Asaas): URL `https://<domínio>/api/webhooks/asaas`, token = `ASAAS_WEBHOOK_TOKEN`, envio **sequencial**, eventos `CHECKOUT_PAID`, `SUBSCRIPTION_*` e `PAYMENT_*`. Só cobranças de assinatura mudam o plano; cobrança avulsa não.

**Em desenvolvimento,** `npm run dev` e, noutro terminal, `npm run tunnel -- --url=<seu-dominio>.ngrok-free.app`: o domínio fixo do ngrok vira a URL do webhook no Sandbox e o `APP_BASE_URL`.

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
