# Arquitetura

Um único app Next.js 16 (App Router) faz tudo: páginas públicas, painel da loja, API e webhooks. Não há backend separado.

```
Comprador ──► /loja/[slug] (vitrine) ──► /carros/[id] ──► /simular ──► POST /api/simulacoes ──► Postgres + R2 (CNH privada)
Garagista ──► /login (Google) ──► /onboarding ──► /painel/{estoque,interessados,loja}
Asaas ──────► POST /api/webhooks/asaas ──► lojas.plano_status
Cron ───────► POST /api/cron/delete-expired-cnh ──► apaga CNHs vencidas no R2
```

## Rotas

| Rota | Quem acessa | O que faz |
|---|---|---|
| `/` | público | Landing para garagistas (tema noturno) |
| `/login` | público | Entrar com Google ou com e-mail e senha (Auth.js) |
| `/cadastro` | público | Cria conta com e-mail e senha e manda o e-mail de confirmação |
| `/esqueci-senha` | público | Manda o link de redefinição (mesma resposta com ou sem conta) |
| `/redefinir-senha?token=` | quem tem o link | Grava a senha nova; o token só é gasto ao salvar |
| `GET /api/conta/confirmar?token=` | quem tem o link | Confirma o e-mail e leva para `/login?aviso=confirmado` |
| `/onboarding` | logado sem loja | Cria a loja (nome, WhatsApp); slug gerado do nome |
| `/painel` | logado | Redireciona para `/painel/estoque` |
| `/painel/estoque`, `/novo`, `/[id]` | dono | Lista, cadastro e edição de carros (fotos no R2) |
| `/painel/interessados` | dono | Leads das simulações: ver CNH, WhatsApp, mudar status, excluir |
| `/painel/loja` | dono | Plano (assinar/pagar), link da vitrine, números, dados da loja, sair |
| `/admin` | e-mail em `ADMIN_EMAILS` | Dono do SaaS: MRR, lojas por situação do plano, carros e simulações por loja. Outros logados recebem 404 |
| `/loja/[slug]` | público | Vitrine; fora do ar se o plano estiver pausado (`layout.tsx`) |
| `/loja/[slug]/carros/[carroId]` | público | Detalhe do carro, WhatsApp e Simular |
| `/loja/[slug]/carros/[carroId]/simular` | público | Formulário de simulação (LGPD + CNH opcional) |
| `POST /api/simulacoes` | público | Grava o lead; `loja_id` sai do carro, nunca do cliente |
| `GET /api/simulacoes/[id]/cnh` | dono | Redireciona para URL assinada da CNH (5 min); 402 se plano pausado |
| `POST /api/webhooks/asaas` | Asaas | Atualiza o plano (ver [pagamentos-asaas.md](pagamentos-asaas.md)) |
| `POST /api/cron/delete-expired-cnh` | cron | Apaga CNHs com mais de 90 dias (Bearer `CRON_SECRET`) |
| `/api/auth/*` | Auth.js | Login e callback do Google |

`src/proxy.ts` (o antigo middleware) é só uma barreira otimista: sem sessão, `/painel`, `/admin` e `/onboarding` vão para `/login`. A checagem de verdade fica em cada página e rota.

## Dados (Supabase Postgres via Drizzle)

Esquema em `src/lib/db/schema.ts`, migrações SQL em `drizzle/`.

- **lojas**: `auth_user_id` (o `sub` do Google, único), `nome`, `slug` (único), `whatsapp`, `cidade`, `plano_status` (`trial | ativo | inadimplente | cancelado`), `trial_ate` (padrão `now() + 7 dias`), `asaas_customer_id` (único), `asaas_checkout_id`, `asaas_subscription_id` (único).
- **carros**: `loja_id`, marca, modelo, versão, ano, km, `preco_centavos`, cor, câmbio, combustível, descrição, `fotos` (jsonb com as chaves no R2), `status` (`disponivel | vendido`).
- **simulacoes_financiamento**: `loja_id`, `carro_id` (set null se o carro sair), nome, telefone, entrada e valor a financiar em centavos, parcelas, `consentimento_lgpd_em`, `cnh_key`, `cnh_uploaded_at`, `status` (`novo | em_contato | aprovado | recusado`).
- **usuarios**: contas de e-mail e senha. `email` (único, minúsculo), `senha_hash` (`scrypt:<salt>:<hash>`), `email_confirmado_em`.
- **tokens_email**: links dos e-mails. `usuario_id`, `tipo` (`confirmar | redefinir`), `token_hash` (sha256; o token só existe no link), `expira_em`.
- **webhook_events**: `provider`, `event_key` (único por provider), `event_type`, `payload`, `processed_at`. Serve de idempotência e de histórico.

Valores em dinheiro são inteiros em centavos. RLS ligado em todas as tabelas sem policies: a API REST do Supabase não lê nada; o app usa a role do servidor.

## Autenticação

Auth.js v5, sessão JWT (`src/lib/auth.ts`), com dois provedores:

- **Google**: o `sub` é o id do Google.
- **E-mail e senha** (Credentials): o `sub` é `usuarios.id`. Só entra quem confirmou o e-mail; sem confirmação, o login reenvia o link.

Nos dois casos a loja liga por `lojas.auth_user_id = sub`. O callback `jwt` procura a loja pelo `sub` e grava `loja_id` no token; enquanto o usuário não tem loja, procura a cada request, e assim o onboarding vale sem refazer login.

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
- Cada aba do painel tem seu `loading.tsx`: em navegação entre abas, o `<Suspense>` do layout não cobre a página.
- Server actions em `src/app/painel/actions.ts`, todas escopadas por `loja_id`.
- PWA: `public/sw.js`, `public/offline.html`, `manifest.ts`.

## Design

Sistema travado em `DESIGN.md` (tema Vantage da Hallmark com as cores do logo; Geologica; tokens em `src/app/tokens.css`). Componentes base do shadcn/ui em `src/components/ui`.
