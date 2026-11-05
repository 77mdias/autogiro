# Pagamentos (Asaas)

Código: `src/lib/plano.ts` (regra), `src/lib/asaas.ts` (API), `src/app/painel/actions.ts` (`assinar`), `src/app/painel/loja/page.tsx` (tela), `src/app/api/webhooks/asaas/route.ts` (webhook), `scripts/loja.mts` (operação manual).

## O plano

Mensalidade por número de vendedores ativos (`FAIXAS` e `valorPlano()` em `src/lib/plano.ts`; o gestor não conta, convite em aberto não paga):

| Vendedores ativos | Mensalidade |
|---|---|
| 0 (individual) | R$ 39 |
| 1 a 4 | R$ 99 |
| 5 a 10 | R$ 139 |
| 11 a 20 | R$ 169 |

Acima de 20 o app não deixa convidar (`MAX_VENDEDORES`). 15 dias grátis (`TRIAL_DIAS`, gravado em `lojas.trial_ate` ao criar a loja; lojas criadas antes ficam com o prazo que já tinham). Regras de liberação em [arquitetura.md](arquitetura.md#plano).

### Mudança de faixa

- `lojas.mensalidade_centavos` guarda o que a assinatura do Asaas cobra hoje. O webhook grava em `SUBSCRIPTION_CREATED` e `SUBSCRIPTION_UPDATED` (campo `value`) e limpa ao cancelar.
- Convidado aceito, vendedor desativado ou reativado: se a faixa mudou e a loja tem assinatura, `ajustarMensalidade()` (em `actions.ts`) chama `PUT /subscriptions/{id}` com o novo `value` e `updatePendingPayments: true`, para valer já na próxima cobrança.
- Se o Asaas recusar, a mudança na equipe vale do mesmo jeito; a coluna fica com o valor antigo e o erro vai para o log.
- Enquanto `mensalidade_centavos` difere da faixa, Minha loja avisa "a partir da próxima cobrança, passa de X para Y" e `/admin` mostra "passa a Y".
- `pnpm docker:exec pnpm loja mensalidades` lista as assinaturas fora da faixa; `... mensalidades aplicar` muda o valor no Asaas. Serve para as lojas do plano antigo e para recusas do Asaas.

### Lojas do plano antigo (R$ 149)

A migração `0009_mensalidade` grava 14900 em toda loja que já tinha assinatura. Elas já veem o aviso em Minha loja. Depois de avisar cada loja (WhatsApp), rode `pnpm loja mensalidades aplicar` antes da próxima cobrança.

## Fase 1 · venda assistida (`ASAAS_CHECKOUT` vazio)

Minha loja mostra "Falar com a AutoGiro" (WhatsApp em `AUTOGIRO_WHATSAPP`, só DDD + número, sem `+55`).

1. No painel do Asaas, crie o cliente e uma **assinatura** mensal no valor da faixa da loja (Minha loja mostra; individual R$ 39) com forma de pagamento "Pergunte ao cliente" (Pix, boleto ou cartão), ou um link de pagamento.
2. Pago: `pnpm docker:exec pnpm loja liberar <slug> cus_...` (o `cus_` está em Clientes).
3. Com o `cus_` gravado, o webhook assume as cobranças seguintes.
4. `pnpm docker:exec pnpm loja listar` lista as lojas; `pnpm docker:exec pnpm loja pausar <slug>` pausa.

Sem o `cus_`, a loja fica ativa até ser pausada à mão.

## Fase 2 · autoatendimento (`ASAAS_CHECKOUT=on`)

1. "Assinar com cartão" chama `assinar()`, que cria um checkout (`POST /checkouts`): cartão, recorrente mensal, valor da faixa pelos vendedores ativos naquela hora, primeira cobrança no fim do teste (ou hoje, se já acabou), expira em 60 min, `externalReference` = id da loja, volta para `/painel/loja?assinatura=ok`.
2. O id do checkout é gravado em `lojas.asaas_checkout_id`.
3. O cliente paga no Asaas. Chegam `CHECKOUT_PAID`, `SUBSCRIPTION_CREATED` e `PAYMENT_CREATED`, os dois últimos com `checkoutSession` = id do checkout. O webhook grava cliente e assinatura na loja.
4. A loja segue em `trial` (liberada por ter assinatura) até a primeira cobrança. `PAYMENT_CONFIRMED` → `ativo`.
5. Com a assinatura já existente, o botão vira "Pagar fatura" e abre a fatura vencida (`invoiceUrl`).

## Webhook

Configuração no Asaas (Integrações › Webhooks):

- URL: `https://<domínio>/api/webhooks/asaas`
- Token de autenticação: valor de `ASAAS_WEBHOOK_TOKEN` (32 a 255 caracteres; nunca a API key)
- Versão v3, envio **sequencial**, fila de sincronização ativada
- Eventos: `CHECKOUT_*`, `SUBSCRIPTION_*`, `PAYMENT_*`

O que cada evento faz:

| Evento | Efeito |
|---|---|
| `CHECKOUT_PAID` | Grava o cliente, se vier (na prática vem `null`) |
| `SUBSCRIPTION_CREATED` | Liga a assinatura à loja (por cliente, `checkoutSession` ou referência) se ela ainda não tem |
| `SUBSCRIPTION_CREATED` / `_UPDATED` | Grava o valor em `mensalidade_centavos` |
| `SUBSCRIPTION_INACTIVATED` / `_DELETED` | `cancelado`, solta a assinatura (pode assinar de novo) e limpa a mensalidade |
| `PAYMENT_CONFIRMED` / `_RECEIVED` | `ativo` |
| `PAYMENT_OVERDUE` | `inadimplente` (pausa) |
| `PAYMENT_REFUNDED` / `_CHARGEBACK_REQUESTED` | `cancelado` |
| outros, ou cobrança sem assinatura | ignorado (só registrado) |

Respostas: 401 sem token válido, 400 JSON inválido ou sem `id`/`event`, 200 `{ ok, duplicado }`, 500 em erro (o Asaas reenvia; a fila pausa após 15 falhas e guarda eventos por 14 dias).

## Ambientes

| | Sandbox | Produção |
|---|---|---|
| API | `https://api-sandbox.asaas.com/v3` | `https://api.asaas.com/v3` |
| Painel | `https://sandbox.asaas.com` | `https://www.asaas.com` |
| Conta e chave | próprias | próprias (outra conta) |

Endpoint só do Sandbox: `POST /sandbox/payment/{id}/confirm` confirma uma cobrança (dispara `PAYMENT_CONFIRMED`/`RECEIVED`). Não há como simular atraso no Sandbox.

## Para ir para produção

O passo a passo geral (Vercel, Supabase, R2, domínio) está em [deploy.md](deploy.md). Do lado do Asaas:


1. Conta Asaas de produção aprovada; chave de produção em `ASAAS_API_KEY`, `ASAAS_API_URL=https://api.asaas.com/v3`.
2. Webhook de produção com um token novo.
3. `APP_BASE_URL` e o redirecionamento do Google no domínio final.
4. `ASAAS_CHECKOUT=on` só quando quiser abrir o autoatendimento.
5. Peça ao gerente de contas a **tokenização de cartão**: sem ela o Asaas de produção não deixa mudar o valor de assinatura de cartão, e a mudança de faixa falha (no Sandbox já vem ligada).
