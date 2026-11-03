# Testes

## Automáticos

`pnpm test` roda os testes com `node --test`:

- `src/lib/signature.test.ts`: comparação do token e do Bearer em tempo constante.
- `src/lib/senha.test.ts`: hash e conferência da senha, tokens.
- `src/lib/plano.test.ts`: `planoLiberado()` em cada status e no fim do teste grátis.
- `src/lib/masks.test.ts`, `src/lib/utils.test.ts`: máscaras e formatação.

Antes de commitar: `pnpm test`, `npx tsc --noEmit`, `pnpm lint`.

## Cartões de teste (Asaas Sandbox)

Só funcionam no Sandbox; nenhum valor é cobrado.

**Aprovado:** qualquer número de cartão fictício válido (o Asaas sugere o gerador da 4Devs). Os mais usados:

| Bandeira | Número |
|---|---|
| Visa | `4111 1111 1111 1111` |
| Mastercard | `5555 5555 5555 4444` |

**Recusado** (indicados pelo Asaas):

| Bandeira | Número |
|---|---|
| Mastercard | `5184 0197 4037 3151` |
| Visa | `4916 5613 5824 0741` |

Validade: qualquer data futura (ex.: `12/2030`). CVV: `123`. Nome e CPF do titular: fictícios (CPF gerado na 4Devs). Nunca use dados reais no Sandbox.

## Contas e dados de teste

| O quê | Onde | Identificador |
|---|---|---|
| Conta Asaas Sandbox | sandbox.asaas.com (conta do dono do projeto) | chave em `.env.local` |
| Loja de teste da fase 2 | Supabase | slug `auto-giro-hehehe-bcb5` (ativa) |
| Cliente Sandbox dessa loja | Asaas Sandbox | `cus_000009793589` |
| Assinatura Sandbox dessa loja | Asaas Sandbox | `sub_g3mwecnktya7m6k3` (cartão, R$ 149/mês) |
| Loja real em teste grátis | Supabase | slug `autocar-77-0974` (não usar em testes) |
| Domínio do túnel | ngrok | `await-creation-manger.ngrok-free.dev` |

Para desfazer a loja de teste: apague a assinatura no Asaas Sandbox (o webhook põe a loja em `cancelado`) ou rode `pnpm loja -- pausar auto-giro-hehehe-bcb5`.

## Validado de ponta a ponta

**No Sandbox, pelo ngrok, contra o Supabase (2026-11-01 e 02):**
- Webhook sem token → 401.
- Assinatura "Pergunte ao cliente" + cobrança confirmada → loja `ativo` em ~7 s.
- Assinatura apagada → `cancelado` em ~1 s, assinatura solta.
- Checkout de cartão real (fase 2): clique em "Assinar com cartão", pagamento com cartão de teste, `CHECKOUT_PAID` + `SUBSCRIPTION_CREATED` + `PAYMENT_CREATED`, loja ligada à assinatura e em `trial`; cobrança confirmada → `ativo`.

**No Postgres local, com eventos montados:** teste grátis, teste vencido (painel vai para Minha loja, vitrine fora do ar, simulação recusada), pagamento antes do `SUBSCRIPTION_CREATED`, atraso (`inadimplente` e "Pagar fatura"), pagamento após atraso, cancelamento, estorno de assinatura antiga ignorado, nova assinatura, outra loja intocada.

**Cadastro por e-mail, no Postgres local, com o envio do Resend interceptado (2026-11-02):** senhas diferentes recusadas com o e-mail mantido no campo; cadastro grava e-mail minúsculo e senha só em hash; e-mail de confirmação sai; login antes de confirmar é recusado; link confirma e leva ao login; link reaberto avisa que venceu; senha errada recusada; login certo leva ao onboarding e a loja fica ligada ao usuário; "Esqueci a senha" responde igual com e sem conta e só envia para quem tem; senha nova grava e leva ao login; link de redefinição reusado é recusado; senha antiga deixa de funcionar e a nova entra.

**Docker com o Criptenv 0.2.3 e credenciais reais (2026-11-02):** imagem sem segredos; variáveis de `development` carregadas; páginas e vitrine com Supabase respondendo 200; nenhuma credencial do Criptenv no `docker inspect` nem no ambiente do app; `docker stop` em 0,6 s; `docker restart` ok. Detalhes em [segredos.md](segredos.md).

## Ainda não testado

- Atraso no Sandbox (não há como vencer uma cobrança lá; coberto só no teste local).
- Cartão recusado no checkout.
- Upload no R2 (variáveis ainda não preenchidas).
- Envio real pelo Resend (falta a conta e o domínio).
- Deploy de produção.
