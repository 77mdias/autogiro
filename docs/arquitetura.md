# Arquitetura

Um único app Next.js 16 (App Router) faz tudo: páginas públicas, painel da loja, API e webhooks. Não há backend separado.

```
Comprador ──► /loja/[slug] (vitrine) ──► /carros/[id] ──► /simular ──► POST /api/simulacoes ──► Postgres + R2 (CNH privada)
Garagista ──► /login (Google ou e-mail) ──► /onboarding ──► /painel/{estoque,interessados,loja}
Dono do SaaS ──► /admin (e-mail em ADMIN_EMAILS)
Asaas ──────► POST /api/webhooks/asaas ──► lojas.plano_status
Cron ───────► POST /api/cron/delete-expired-cnh ──► apaga CNHs vencidas no R2
```

## Rotas

| Rota | Quem acessa | O que faz |
|---|---|---|
| `/` | público | Landing para garagistas |
| `/login` | público | Entrar com Google ou com e-mail e senha (Auth.js) |
| `/cadastro` | público | Cria conta com e-mail e senha e manda o e-mail de confirmação |
| `/esqueci-senha` | público | Manda o link de redefinição (mesma resposta com ou sem conta) |
| `/redefinir-senha?token=` | quem tem o link | Grava a senha nova; o token só é gasto ao salvar |
| `GET /api/conta/confirmar?token=` | quem tem o link | Confirma o e-mail e leva para `/login?aviso=confirmado` |
| `/onboarding` | logado sem loja | Cria a loja (nome, WhatsApp); slug gerado do nome |
| `/painel` | logado | Redireciona para `/painel/estoque` |
| `/painel/estoque`, `/novo`, `/[id]` | membro | Lista, cadastro e edição de carros (fotos no R2); a edição do vendedor vira pedido |
| `/painel/interessados` | membro | Leads: o vendedor vê os dele, o gestor vê todos e distribui os dele; CNH, WhatsApp, status e excluir só para o responsável |
| `/painel/pedidos` | membro | Gestor aprova ou recusa edições e exclusões pedidas por vendedores; vendedor acompanha os dele |
| `/painel/loja` | membro | Plano, link da vitrine, números; dados da loja e assinatura só para o gestor |
| `/admin` | e-mail em `ADMIN_EMAILS` | Dono do SaaS: MRR, lojas por situação do plano, carros e simulações por loja. Outros logados recebem 404 |
| `/loja/[slug]` | público | Vitrine; fora do ar se o plano estiver pausado (`layout.tsx`) |
| `/loja/[slug]/carros/[carroId]` | público | Detalhe do carro, WhatsApp e Simular |
| `/loja/[slug]/carros/[carroId]/simular` | público | Formulário de simulação (LGPD + CNH opcional) |
| `POST /api/simulacoes` | público | Grava o lead; `loja_id` sai do carro, nunca do cliente |
| `GET /api/simulacoes/[id]/cnh` | responsável pelo lead | Redireciona para URL assinada da CNH (5 min); 402 se plano pausado |
| `POST /api/webhooks/asaas` | Asaas | Atualiza o plano (ver [pagamentos-asaas.md](pagamentos-asaas.md)) |
| `POST /api/cron/delete-expired-cnh` | cron | Apaga CNHs com mais de 90 dias (Bearer `CRON_SECRET`) |
| `/api/auth/*` | Auth.js | Login e callback do Google |

`src/proxy.ts` (o antigo middleware) é só uma barreira otimista: sem sessão, `/painel`, `/admin` e `/onboarding` vão para `/login`. A checagem de verdade fica em cada página e rota.

## Código

```
src/
  proxy.ts                barreira otimista de login (/painel, /admin, /onboarding) e 404 do /admin para quem não é admin
  instrumentation.ts      migrações ao subir, só nos containers (MIGRAR_AO_SUBIR=1)
  lib/
    db/schema.ts          tabelas (ver Dados)          db/migrar.ts   aplica drizzle/ ao subir
    auth.ts               Auth.js: Google + e-mail; loja_id no token (callback jwt)
    session.ts            getSession, getLojaId/requireLojaId (única fonte de loja_id), requireAdmin
    plano.ts              planoLiberado(), situacaoPlano(), resumoAssinaturas()
    admin.ts              ehAdmin() (ADMIN_EMAILS)
    asaas.ts              API v3 do Asaas (fetch, sem SDK)
    r2.ts                 fotos (bucket público) e CNH (privado, URL assinada de 5 min)
    conta.ts, email.ts, senha.ts   conta de e-mail: tokens, envio pelo Resend, scrypt
    files.ts, resize-image.ts      tipo do arquivo pelos bytes; redução da foto no navegador
    masks.ts, signature.ts, utils.ts
  app/
    page.tsx + components/landing/        landing
    login, cadastro, esqueci-senha, redefinir-senha, onboarding
    painel/{estoque,interessados,loja}    painel da loja; painel/actions.ts tem as server actions
    admin/                                painel do dono do SaaS
    loja/[slug]/…                         vitrine, carro, simulação
    api/                                  simulacoes, simulacoes/[id]/cnh, webhooks/asaas, cron, conta, auth
scripts/loja.mts          operação manual do plano (fase 1)
drizzle/                  migrações SQL geradas pelo drizzle-kit
```

Módulos de `src/lib` com testes (`*.test.ts`) rodam direto no `node --test`: não usam o alias `@/` e importam irmãos com `.ts`.

## Dados (Supabase Postgres via Drizzle)

Esquema em `src/lib/db/schema.ts`, migrações SQL em `drizzle/`.

- **lojas**: `auth_user_id` (o `sub` do Google, único), `nome`, `slug` (único), `whatsapp`, `cidade`, `plano_status` (`trial | ativo | inadimplente | cancelado`), `trial_ate` (padrão `now() + 7 dias`), `asaas_customer_id` (único), `asaas_checkout_id`, `asaas_subscription_id` (único).
- **membros**: quem entra no painel. `loja_id`, `auth_user_id` (o `sub`, único: uma conta, uma loja), `papel` (`gestor | vendedor`), `nome`, `ativo`. O dono que criou a loja é o gestor.
- **carros**: `loja_id`, marca, modelo, versão, ano, km, `preco_centavos`, cor, câmbio, combustível, descrição, `fotos` (jsonb com as chaves no R2), `status` (`disponivel | vendido`), `cadastrado_por` (membro que cadastrou).
- **simulacoes_financiamento**: `loja_id`, `carro_id` (set null se o carro sair), nome, telefone, entrada e valor a financiar em centavos, parcelas, `consentimento_lgpd_em`, `cnh_key`, `cnh_uploaded_at`, `status` (`novo | em_contato | aprovado | recusado`), `responsavel_id` (membro dono do lead).
- **usuarios**: contas de e-mail e senha. `email` (único, minúsculo), `senha_hash` (`scrypt:<salt>:<hash>`), `email_confirmado_em`.
- **tokens_email**: links dos e-mails. `usuario_id`, `tipo` (`confirmar | redefinir`), `token_hash` (sha256; o token só existe no link), `expira_em`.
- **pedidos_edicao**: `loja_id`, `carro_id` (set null se o carro sair), `membro_id` (quem pediu), `tipo` (`editar | excluir`), `mudancas` (jsonb com os campos do carro, `fotosNovas` e `fotosRemover`), `status` (`pendente | aprovado | recusado`), `decidido_por`, `decidido_em`. Um pendente por carro (índice único parcial).
- **webhook_events**: `provider`, `event_key` (único por provider), `event_type`, `payload`, `processed_at`. Serve de idempotência e de histórico.

Valores em dinheiro são inteiros em centavos. RLS ligado em todas as tabelas sem policies: a API REST do Supabase não lê nada; o app usa a role do servidor.

## Autenticação

Auth.js v5, sessão JWT (`src/lib/auth.ts`), com dois provedores:

- **Google**: o `sub` é o id do Google.
- **E-mail e senha** (Credentials): o `sub` é `usuarios.id`. Só entra quem confirmou o e-mail; sem confirmação, o login reenvia o link.

Nos dois casos a loja liga por `membros.auth_user_id = sub` (só membros ativos). O callback `jwt` procura o membro a cada request e grava `loja_id`, `membro_id` e `papel` no token: o onboarding vale sem refazer login, e um vendedor desativado perde o acesso na hora. O onboarding cria a loja e o membro gestor na mesma transação; `lojas.auth_user_id` segue como o dono da conta.

Contas Google e de e-mail são **separadas**, mesmo com o mesmo endereço: cada uma tem a sua loja.

Fluxo de e-mail (`src/lib/conta.ts`, `src/lib/email.ts`, `src/app/login/actions.ts`):

| Situação | O que acontece |
|---|---|
| Cadastro novo | Cria o usuário e manda "Confirme seu e-mail" (link de 24 h) |
| Cadastro de e-mail já confirmado | Manda "Você já tem conta"; a tela responde igual, sem revelar quem é cliente |
| Cadastro de e-mail ainda não confirmado | Troca a senha e manda um link novo (só quem abre o e-mail ativa) |
| Login sem confirmar | Recusa e reenvia o link |
| Esqueci a senha | Link de 1 h, uso único; salvar a senha também confirma o e-mail |

Cada link novo apaga os anteriores do mesmo tipo, e só sai um e-mail por minuto por conta e tipo. Senhas com `scrypt` do Node; o login confere contra um hash falso quando o e-mail não existe, para o tempo de resposta não revelar contas.

## Multi-tenant (isolamento entre lojas)

- Em código autenticado, `loja_id` vem **só** de `getLojaId()`/`requireLojaId()` (`src/lib/session.ts`) e entra em todo `where`. Nunca de query string, body ou params.
- Em rotas públicas, `loja_id` é derivado do recurso (o carro).
- Papel: só o gestor edita ou exclui carro, altera os dados da loja e assina (`getLojaIdDoGestor()` nas actions; `requireLojaId(..., { soGestor: true })` nas páginas). O vendedor cadastra carro direto; editar e excluir viram pedido em `pedidos_edicao`. As fotos novas do pedido já sobem para o R2 e só entram no carro na aprovação (`aprovarPedido` marca o pedido e aplica no carro na mesma transação); recusar apaga essas fotos. As regras puras (diferenças, fotos finais, limite de 15) estão em `src/lib/pedidos.ts`, com testes.
- Leads: `POST /api/simulacoes` grava como responsável quem cadastrou o carro (se ativo) ou o gestor. Só o responsável vê a CNH, chama, descarta e marca contato; o vendedor vê só a carteira dele; o gestor vê todos e passa os dele para um vendedor (`distribuirLead`). Os contadores de "novas" contam só os leads de quem está logado.
- Toda tabela de dados da loja tem `loja_id` com `on delete cascade`.

## Plano

`src/lib/plano.ts` tem a regra única `planoLiberado()`:

| Status | Liberado? |
|---|---|
| `ativo` | sim |
| `trial` | sim, se ainda está dentro de `trial_ate` **ou** já tem assinatura (o cartão será cobrado no fim do teste) |
| `inadimplente`, `cancelado` | não |

Plano pausado: as páginas do painel levam para Minha loja (`requireLojaId` com `exigePlano`), a vitrine mostra "Vitrine fora do ar", `POST /api/simulacoes` responde 404 e a CNH responde 402. Minha loja sempre abre (`exigePlano: false`), porque é lá que se paga.

## Arquivos (Cloudflare R2)

- **Bucket público** (`R2_PUBLIC_BUCKET`): fotos dos carros, servidas pelo domínio `R2_PUBLIC_URL`. O navegador reduz a foto antes de enviar (`resize-image.ts`, lado maior 1600 px).
- **Bucket privado** (`R2_PRIVATE_BUCKET`): CNHs. Só o dono da loja recebe uma URL assinada de 5 minutos. Apagadas pelo cron após 90 dias (prazo a confirmar com o jurídico).
- Uploads até 5 MB, tipo conferido pelos bytes do arquivo (`files.ts`), não pela extensão.

## Renderização (Next 16)

- `cacheComponents: true` e `partialPrefetching: true`. Dados de sessão ficam atrás de `connection()` em `getSession()`.
- Toda página que lê dados tem o seu `loading.tsx` (painel, vitrine, carro, simulação): na navegação, o `<Suspense>` do layout pai não cobre a página nova e o Next acusa "uncached data".
- Migrações: nos containers, `src/instrumentation.ts` aplica as pendentes ao subir; na Vercel, o build de produção aplica antes do `next build` ([deploy.md](deploy.md)).
- Server actions em `src/app/painel/actions.ts`, todas escopadas por `loja_id`.
- PWA: `public/sw.js`, `public/offline.html`, `manifest.ts`.

## Design

Sistema travado em `DESIGN.md` (tema Vantage da Hallmark com as cores do logo; Rethink Sans nos títulos, Plus Jakarta Sans no texto, JetBrains Mono; tokens em `src/app/tokens.css`). Componentes base do shadcn/ui em `src/components/ui`. A landing segue o contrato de [landing-3d.md](landing-3d.md).
