# Deploy (Cloudflare Workers)

Banco no Supabase (um projeto para dev, outro para produção), app num **Cloudflare Worker** pelo [vinext](https://vinext.dev), segredos no Criptenv. Produção em **https://autogiro.wdias.tech** (`domains` em `cloudflare.config.ts`).

Até 2026-11-16 a produção ficava na Vercel; a troca está em [decisoes.md](decisoes.md) e a virada, passo a passo, em [Virada da Vercel](#virada-da-vercel-uma-vez) no fim deste arquivo.

## Fluxo

```
branch ──► PR ──► CI (GitHub Actions) ──► merge na main ──► CI de novo ──► migrações ──► vite build ──► Worker no ar
                  lint, tipos, testes,                                    (DATABASE_URL_DIRECT)   (vinext-cloudflare deploy)
                  build, migração pendente
```

- **CI** (`.github/workflows/ci.yml`, job `checks`): roda em todo PR e em todo push na `main`, sem segredo nenhum. O passo "Schema sem migração pendente" falha se `src/lib/db/schema.ts` mudou e ninguém rodou `pnpm db:generate`.
- **Produção** (job `deploy`, só em push na `main`, depois dos checks, no environment `production` do GitHub): `pnpm db:migrate` pelo session pooler e `pnpm run deploy` (`vinext-cloudflare deploy`, que faz o build e publica). Se a migração falhar, nada é publicado e a versão anterior continua no ar. Um deploy nunca é cancelado no meio.
- **Sem prévia por PR por enquanto.** As prévias de Worker usariam os mesmos segredos e o mesmo Hyperdrive da produção (banco de produção com o código do PR, antes da migração). Para ligar, falta um Hyperdrive de dev e segredos por modo (`defineWorker(({ isPreview }) => …)`); fica em [estado.md](produto/estado.md).
- `pnpm deploy` sem `run` é um comando do próprio pnpm: use sempre `pnpm run deploy`.

**Migração que não quebra o que está no ar.** Ela é aplicada antes do código novo entrar. Se o deploy falhar depois, o banco já mudou e o código antigo segue rodando. Portanto: coluna nova nasce opcional (ou com default); remover ou renomear coluna é em dois deploys (primeiro o código para de usar, depois a migração remove). Exemplo: `usuarios.senha_hash` e `email_confirmado_em` ficaram na 0011 e saem numa migração seguinte.

## O que o Worker usa

| Peça | Onde | Observação |
|---|---|---|
| Plano **Workers Paid** (US$ 5/mês) | conta da Cloudflare | O plano grátis dá 10 ms de CPU por pedido: o scrypt do login passa disso |
| Worker `autogiro` | `cloudflare.config.ts` | Entrada `worker/index.ts`, perto do Supabase (`placement` em `aws:us-east-1`), logs ligados |
| **Hyperdrive** (`HYPERDRIVE`) | `HYPERDRIVE_ID` em `cloudflare.config.ts` | Guarda o pool de conexões com o Supabase; cada pedido abre o seu cliente através dele |
| **Cloudflare Images** (`IMAGES`) | binding, sem configuração | Redimensiona o `next/image`. Grátis até 5.000 transformações únicas por mês |
| Cron diário 06:00 UTC | `triggers` em `cloudflare.config.ts` | Apaga as CNHs com mais de 90 dias (`src/lib/limpeza-cnh.ts`) |
| Segredos (19) | lista `segredos` em `cloudflare.config.ts` | Valores no Criptenv; no Worker, pela integração do Criptenv com a Cloudflare |
| Domínio `autogiro.wdias.tech` | `domains` em `cloudflare.config.ts` | Domínio personalizado do Worker; a zona `wdias.tech` está na Cloudflare |

R2 continua igual: dois buckets por ambiente pela API S3 (`R2_*`), como antes.

## Configurar (uma vez)

1. **Supabase de produção**: o projeto que já existe. Região `us-east-1`, a mesma do `placement` do Worker.
2. **Hyperdrive**, apontando para o **session pooler** (porta 5432) do Supabase de produção, o mesmo `DATABASE_URL_DIRECT`. Pelo painel (Storage & Databases → Hyperdrive → Create, colando a connection string), para a senha do banco não passar pelo histórico do shell. Pela CLI seria `pnpm exec cf hyperdrive create --name autogiro-producao --origin-scheme postgresql --origin-host aws-0-us-east-1.pooler.supabase.com --origin-port 5432 --origin-database postgres --origin-user postgres.<ref> --origin-password …`. **Desligue o cache de consultas** (na configuração criada, Settings → Caching → Disabled): o Hyperdrive guarda o resultado dos `SELECT` por até 60 s e não invalida nada quando o app escreve, então sessão apagada, plano liberado ou carro editado apareceriam velhos. O app quer só o pool de conexões. Cole o id em `HYPERDRIVE_ID` (`cloudflare.config.ts`) e commite: o id não é segredo. Sem ele, o deploy falha.
3. **Segredos no Criptenv `production`**: os 19 nomes da lista `segredos`, mais `DATABASE_URL_DIRECT`. Valores que mudam em relação a dev: `AUTH_URL` e `APP_BASE_URL` (`https://autogiro.wdias.tech`, exatos, sem barra no fim), Asaas e R2 de produção. `ASAAS_CHECKOUT` precisa de valor: `off` na venda assistida, `on` no autoatendimento (segredo vazio derruba o deploy). `ADMIN_EMAILS` com o seu e-mail.
4. **Primeiro deploy** (o Worker ainda não existe e não aceita segredo antes de existir), da sua máquina:
   ```bash
   pnpm exec cf auth login
   criptenv run -e production -p <ID do projeto> -- node scripts/primeiro-deploy.mts
   ```
   O script confere os 19 segredos, aplica as migrações, faz o build e publica. O `--secrets-file` leva só os nomes; o `cf` usa os valores do ambiente do Criptenv, então nenhum segredo vai para o disco.
5. **Criptenv → Cloudflare**, para trocar segredo depois sem redeploy de código:
   ```bash
   criptenv integrations connect cloudflare --token <token da Cloudflare> --account-id <id da conta> --project-id autogiro --project <ID do Criptenv>
   criptenv integrations sync --provider cloudflare --env production --direction push
   ```
   O token precisa de **Workers Scripts: Edit**. O sync manda todas as variáveis do ambiente; as que o Worker não declara ficam sem uso.
6. **GitHub** (Settings → Environments → `production`): secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit, Workers Routes/Custom Domains, Hyperdrive: Read, Account Settings: Read), `CLOUDFLARE_ACCOUNT_ID` e `DATABASE_URL_DIRECT` (session pooler de produção, para as migrações). Proteção da `main`: exigir PR e o check **"Lint, tipos, testes, build e migrações"**.
7. **Serviços que apontam para o domínio**: callback do Google OAuth (`https://autogiro.wdias.tech/api/auth/callback/google`, o mesmo caminho do Auth.js) e o webhook do Asaas de produção (`/api/webhooks/asaas`). Ao trocar de domínio, mude esses dois, `AUTH_URL`, `APP_BASE_URL` e `domains`.

## Cron (limpeza das CNHs)

O próprio Worker roda `apagarCnhsVencidas()` todo dia às 06:00 UTC (`scheduled` em `worker/index.ts`): apaga do R2 as CNHs com mais de 90 dias e limpa a chave no banco só do que o R2 confirmou. O resultado sai nos logs do Worker (`CNHs apagadas: N`). Não há rota HTTP nem `CRON_SECRET`.

## Testar o build de produção localmente

`pnpm docker:exec pnpm build` e depois `pnpm docker:exec pnpm preview`: roda o Worker construído no workerd, com os segredos de `development`, na porta 3000 (pare o `docker:up` antes, ou use outra porta).

## Virada da Vercel (uma vez)

A Vercel e o Worker usam o mesmo banco de produção. A ordem evita que os dois rodem juntos por muito tempo:

1. Passos 1 a 3 e 6 de [Configurar](#configurar-uma-vez), e o `HYPERDRIVE_ID` commitado.
2. Na Vercel, **desligar o deploy automático** (Settings → Git → desconectar o repositório). Senão o merge dispara um build da Vercel que falha (o código não roda mais no `next build`), e a versão antiga segue no ar sem aviso.
3. No DNS de `wdias.tech` (Cloudflare), **apagar o CNAME `autogiro`** que aponta para a Vercel: o domínio personalizado do Worker não é criado com um registro existente. A partir daqui o site fica fora do ar até o passo 5.
4. Primeiro deploy ([passo 4](#configurar-uma-vez)). Ele aplica a migração 0011: as contas de e-mail passam para o Better Auth com as mesmas senhas.
5. Conferir: `/`, uma vitrine, entrar com e-mail e senha, entrar com Google. **Todo mundo precisa entrar de novo** (as sessões do Auth.js eram JWT e não valem mais). Quem entrava pelo Google tem a loja ligada de volta no primeiro login.
6. Merge do PR na `main`: daqui em diante o GitHub Actions faz o deploy.
7. Domínio antigo `autogiro.77mdevseven.tech`: na Vercel ele era um redirect 308 para o novo. Se a zona `77mdevseven.tech` estiver nesta conta da Cloudflare, crie uma Redirect Rule (Rules → Redirect Rules) de `autogiro.77mdevseven.tech/*` para `https://autogiro.wdias.tech/${1}`, 308. Senão, mantenha o projeto da Vercel só para esse redirect.
8. Apagar o Worker antigo do cron (o que chamava `/api/cron/delete-expired-cnh`) e o `CRON_SECRET` do Criptenv e da Cloudflare.
9. Numa migração seguinte, remover `usuarios.senha_hash` e `usuarios.email_confirmado_em`. Antes, copiar de novo para `logins` quem tiver se cadastrado pela Vercel entre a migração e o passo 3 (o `INSERT … ON CONFLICT DO NOTHING` da 0011 serve).

**Caso raro:** quem tinha uma loja pela conta Google e **outra** loja por e-mail e senha com o mesmo endereço. No primeiro login pelo Google as duas contas viram uma só, e como uma conta tem uma loja, a do Google fica sem dono (`auth_user_id` com o `sub`). Resolver à mão, se aparecer.
