# Registro de decisões

Mais recentes primeiro. Cada uma: o que foi decidido e por quê.

## 2026-11-02 · Segredos no Criptenv, sem `.env` no disco
`.env.local` em texto claro fica ao alcance de agentes de IA, backups e de um `git add` errado. Os segredos passam para o Criptenv (zero-knowledge) e o app roda em Docker com eles só na memória.
- Build da imagem sem segredos; em execução, `docker/entrypoint.sh` busca as variáveis com a CLI do Criptenv.
- Credenciais da máquina (API key só leitura por ambiente + senha do cofre) chegam como Docker secrets, guardadas no chaveiro do sistema no host.
- O container usa `criptenv run` (0.2.3+), que tira as credenciais do ambiente do app e faz `exec` do node. Na 0.2.2 isso não era seguro e havia um entrypoint em Node, removido em 2026-11-03.
- Detalhes e passo a passo em [segredos.md](segredos.md).

## 2026-11-02 · Cadastro por e-mail e senha, com Resend
Nem todo garagista quer entrar com Google. Conta própria em `usuarios`, login pelo provedor Credentials do Auth.js, confirmação obrigatória por e-mail e "Esqueci a senha" desde o início (sem ele, quem esquece fica preso).
- **Resend** pela API simples e plano grátis; chamado por `fetch`, sem SDK.
- **scrypt** do Node em vez de bcrypt/argon2: sem dependência nova.
- Tokens guardados só como hash, uso único, prazo curto.
- Telas não revelam se um e-mail tem conta.
- Contas Google e de e-mail não se juntam pelo endereço (juntar exigiria provar a posse dos dois lados).
- Sem limite de tentativas por IP por enquanto (só um e-mail por minuto por conta).

## 2026-11-02 · Casar o checkout pago pelo `checkoutSession`
O `CHECKOUT_PAID` do Asaas chega **sem** `customer`, e a assinatura e as cobranças chegam sem `externalReference`. Elas trazem `checkoutSession`, o id do checkout que gravamos em `lojas.asaas_checkout_id` ao abrir o checkout. O webhook passou a achar a loja por ele. Sem isso a loja pagava e era bloqueada no fim do teste.

## 2026-11-02 · `AUTH_URL` fixo em desenvolvimento
Pelo ngrok, o Next repassa o host como `localhost:3000` e o Auth.js montava o callback errado (`redirect_uri_mismatch`). Em dev, `AUTH_URL` = domínio do ngrok.

## 2026-11-02 · Escapar o `$` da chave do Asaas no `.env`
A chave começa com `$`; o Next expande variáveis no `.env` e ela ficava vazia. Escrever `\$aact_...`.

## 2026-11-02 · Logo sempre leva à página inicial; telas sem largura máxima
Pedido do produto. A logo do painel ia para o Estoque; a do onboarding e a do rodapé da landing não tinham link. Vitrine e painel ocupam a largura toda.

## 2026-11-01 · Asaas no lugar da Appmax
Troca de gateway. Asaas tem assinatura recorrente nativa (gera as cobranças sozinho), Checkout hospedado, Pix/boleto/cartão e Sandbox completo.

## 2026-11-01 · Plano único: R$ 149/mês, 7 dias grátis sem cartão
Simples de vender e de explicar. O teste começa ao criar a loja (`trial_ate`), sem pedir cartão.

## 2026-11-01 · Sem CPF/CNPJ no cadastro
Começou pedindo CNPJ; foi retirado por questão técnica. O Asaas coleta o documento no próprio checkout.

## 2026-11-01 · Duas fases de venda
- **Fase 1, venda assistida** (primeiros 5 a 10 garagistas): link de pagamento (Pix, boleto ou cartão) e liberação manual pelo `npm run loja`. Permite vender antes do autoatendimento estar redondo e aceitar Pix/boleto.
- **Fase 2, autoatendimento**: `ASAAS_CHECKOUT=on`, assinatura por cartão no Checkout do Asaas. O Asaas gera as cobranças a cada mês e o webhook mantém o plano.

## 2026-11-01 · Bloqueio por atraso via webhook
Cobrança vencida (`PAYMENT_OVERDUE`) pausa painel e vitrine na hora; pagamento confirmado libera. Estorno/chargeback cancela. Só cobranças **de assinatura** mexem no plano.

## 2026-11-01 · Webhook idempotente e transacional
Registro do evento (`webhook_events`, único por id) e efeito na mesma transação. Reenvio do Asaas é ignorado; falha no processamento faz rollback, responde 500 e o Asaas reenvia. Envio configurado como **sequencial**.

## 2026-11-01 · Token do webhook separado da API key
`ASAAS_WEBHOOK_TOKEN` é um segredo próprio, comparado em tempo constante. Nunca reutilizar a API key.

## 2026-11-01 · ngrok com domínio fixo em dev
O Asaas Sandbox e o Google precisam de uma URL HTTPS estável. Domínio grátis do ngrok, instalado globalmente.

## Antes de 2026-11 · Base do produto
- **Next.js 16 full-stack** (sem backend separado), mobile-first, PWA.
- **Supabase Postgres + Drizzle**: SQL de verdade, migrações versionadas, tipos.
- **Login só com Google** (Auth.js): sem senha para guardar, garagista já tem conta Google.
- **Multi-tenant por `loja_id` vindo só da sessão**, com RLS ligado e sem policies como segunda barreira.
- **CNH privada** no R2, URL assinada de 5 min só para a loja dona, apagada após 90 dias (LGPD; consentimento registrado).
- **Valores em centavos** (inteiros).
- **Design**: tema Vantage da Hallmark com as cores do logo, travado em `DESIGN.md`.
- **Segredos nunca no git**: `.env*` ignorado, exceto `.env.example`.
