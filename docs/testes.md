# Testes

## Automáticos

`pnpm test` roda os testes com `node --test`:

- `src/lib/signature.test.ts`: comparação do token e do Bearer em tempo constante.
- `src/lib/senha.test.ts`: hash e conferência da senha, tokens.
- `src/lib/plano.test.ts`: `planoLiberado()` em cada status e no fim do teste grátis; situação e MRR do painel do administrador.
- `src/lib/admin.test.ts`: quem é admin pela lista `ADMIN_EMAILS`.
- `src/lib/landing-tier.test.ts`: escolha do nível de desempenho da landing por aparelho.
- `src/lib/masks.test.ts`, `src/lib/utils.test.ts`: máscaras e formatação.

Antes de commitar: `pnpm test`, `pnpm typecheck`, `pnpm lint`. O CI roda os mesmos, mais o build e a checagem de migração pendente, em todo PR.

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
| Conta de teste (navegador) | Supabase de dev | `E2E_EMAIL` / `E2E_SENHA` no `.env.example` (pública de propósito, só dados falsos) |
| Loja da conta de teste | Supabase de dev | "Garagem Teste AutoGiro", slug `garagem-teste-autogiro-eb5b` (carro e simulações de teste) |
| Conta Asaas Sandbox | sandbox.asaas.com (conta do dono do projeto) | `ASAAS_API_KEY` no Criptenv (`development`) |
| Loja de teste da fase 2 | Supabase | slug `auto-giro-hehehe-bcb5` (ativa) |
| Cliente Sandbox dessa loja | Asaas Sandbox | `cus_000009793589` |
| Assinatura Sandbox dessa loja | Asaas Sandbox | `sub_g3mwecnktya7m6k3` (cartão, R$ 149/mês) |
| Loja real em teste grátis | Supabase | slug `autocar-77-0974` (não usar em testes) |
| Domínio do túnel | ngrok | `await-creation-manger.ngrok-free.dev` |

Para desfazer a loja de teste: apague a assinatura no Asaas Sandbox (o webhook põe a loja em `cancelado`) ou rode `pnpm docker:exec pnpm loja pausar auto-giro-hehehe-bcb5`.

## Validar no navegador

1. `pnpm docker:up` e abra `http://localhost:3000`.
2. Entre com a conta de teste. Em dev, `AUTH_URL` aponta para o ngrok: depois do login o navegador vai para lá, mas o cookie fica em `localhost`; volte para `http://localhost:3000/painel`.
3. Com o Playwright: o Next 16 mantém a tela anterior montada e escondida, então pode haver dois `<main>`. Use `.first()` ou um screenshot antes de concluir que a página travou.
4. Consultas ao banco só por dentro do container: `pnpm docker:exec <comando>` (o host não tem `DATABASE_URL`).

## Validado de ponta a ponta

**No Sandbox, pelo ngrok, contra o Supabase (2026-11-01 e 02):**
- Webhook sem token → 401.
- Assinatura "Pergunte ao cliente" + cobrança confirmada → loja `ativo` em ~7 s.
- Assinatura apagada → `cancelado` em ~1 s, assinatura solta.
- Checkout de cartão real (fase 2): clique em "Assinar com cartão", pagamento com cartão de teste, `CHECKOUT_PAID` + `SUBSCRIPTION_CREATED` + `PAYMENT_CREATED`, loja ligada à assinatura e em `trial`; cobrança confirmada → `ativo`.

**No Postgres local, com eventos montados:** teste grátis, teste vencido (painel vai para Minha loja, vitrine fora do ar, simulação recusada), pagamento antes do `SUBSCRIPTION_CREATED`, atraso (`inadimplente` e "Pagar fatura"), pagamento após atraso, cancelamento, estorno de assinatura antiga ignorado, nova assinatura, outra loja intocada.

**Cadastro por e-mail, no Postgres local, com o envio do Resend interceptado (2026-11-02):** senhas diferentes recusadas com o e-mail mantido no campo; cadastro grava e-mail minúsculo e senha só em hash; e-mail de confirmação sai; login antes de confirmar é recusado; link confirma e leva ao login; link reaberto avisa que venceu; senha errada recusada; login certo leva ao onboarding e a loja fica ligada ao usuário; "Esqueci a senha" responde igual com e sem conta e só envia para quem tem; senha nova grava e leva ao login; link de redefinição reusado é recusado; senha antiga deixa de funcionar e a nova entra.

**Docker com o Criptenv 0.2.3 e credenciais reais (2026-11-02):** imagem sem segredos; variáveis de `development` carregadas; páginas e vitrine com Supabase respondendo 200; nenhuma credencial do Criptenv no `docker inspect` nem no ambiente do app; `docker stop` em 0,6 s; `docker restart` ok. Detalhes em [segredos.md](segredos.md).

**No container de dev com o Criptenv e o Supabase de dev (2026-11-03):** cadastro por e-mail (envio pelo Resend ao endereço de teste), onboarding, cadastrar, editar, marcar vendido e excluir carro, compartilhar, vitrine com filtro e busca, WhatsApp com mensagem pronta, simulação com e sem CNH, valor acima do limite recusado (antes dava 500), Interessados, foto no R2 público (`r2.dev`), CNH no R2 privado só por link assinado (404/400 por URL pública), Ver CNH (302 para link de 5 min; 401 sem login), cron com e sem `CRON_SECRET` (200/401), `/admin` (404 para não admin, redireciona sem login), migração automática ao subir (dev e imagem de produção), hot reload do Compose Watch.

**Produção na Vercel (2026-11-03):** landing e `/login` no ar; `/api/auth/*` respondendo 200 depois de corrigir o formato do `AUTH_URL`.

## Ainda não testado

- Atraso no Sandbox (não há como vencer uma cobrança lá; coberto só no teste local).
- Cartão recusado no checkout.
- Entrega do Resend numa caixa de e-mail real (o envio ao endereço de teste funciona).
- Fluxo completo em produção: cadastro, foto e CNH no R2 de produção, webhook do Asaas de produção.
