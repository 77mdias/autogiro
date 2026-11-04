# Deploy (Vercel)

Banco no Supabase (um projeto para dev, outro para produção), app na Vercel, segredos no Criptenv.

## Fluxo

```
branch ──► PR ──► CI (GitHub Actions) + prévia da Vercel ──► merge na main ──► deploy de produção da Vercel
                  lint, tipos, testes, build,                                   migrações ──► next build ──► no ar
                  migração pendente                                             (scripts/vercel-build.sh)
```

- **CI** (`.github/workflows/ci.yml`): roda em todo PR e em todo push na `main`, sem segredo nenhum. O passo "Schema sem migração pendente" falha se `src/lib/db/schema.ts` mudou e ninguém rodou `pnpm db:generate`.
- **Prévia**: a Vercel publica cada PR numa URL própria, com as variáveis de Preview (banco de dev). Prévia não migra nada.
- **Produção**: a cada merge na `main`, a Vercel roda `scripts/vercel-build.sh` (definido em `vercel.json`): com `VERCEL_ENV=production`, aplica as migrações pendentes (`pnpm db:migrate`, pelo `DATABASE_URL_DIRECT`) e só então faz o `next build`. Se a migração falhar, o deploy aborta e a versão anterior continua no ar.
- **Por que no build e não ao subir o servidor:** na Vercel cada instância de função subiria e tentaria migrar. No build roda uma vez por deploy. Nos containers locais a migração é ao subir (`MIGRAR_AO_SUBIR=1`, `src/instrumentation.ts`).

**Migração que não quebra o que está no ar.** Ela é aplicada antes do código novo entrar. Se o build falhar depois, o banco já mudou e o código antigo segue rodando. Portanto: coluna nova nasce opcional (ou com default); remover ou renomear coluna é em dois deploys (primeiro o código para de usar, depois a migração remove).

## Configurar (uma vez)

1. **Supabase de produção**: um projeto novo. O banco começa vazio; o primeiro deploy aplica todas as migrações. Região perto da função da Vercel (o padrão da Vercel é `iad1`, Washington; o Supabase de dev está em `us-east-1`).
2. **Projeto na Vercel**: importar o repositório do GitHub (framework Next.js). O build vem do `vercel.json`; em Settings → General, Node.js **24.x**. O pnpm é detectado pelo `packageManager`.
3. **Variáveis**: a fonte é o Criptenv, sincronizado com a Vercel pela integração:
   ```bash
   criptenv integrations connect vercel --token <token da Vercel> --project-id <prj_...> --project <ID do Criptenv>
   criptenv integrations sync --provider vercel --env production --direction push
   ```
   Depois, em Settings → Environment Variables, confira que as de `production` ficaram só no alvo **Production** e que **Preview** recebeu as de `development` (banco de dev). Valores que mudam em produção: `APP_BASE_URL` e `AUTH_URL` (domínio final), `DATABASE_URL` (pooler de transação, 6543) e `DATABASE_URL_DIRECT` (session pooler, 5432, usado nas migrações), chaves do Asaas de produção, R2 de produção. `ADMIN_EMAILS` com o seu e-mail; `E2E_*` não vai para produção.
4. **Proteção da `main`** (GitHub → Settings → Branches): exigir PR e o check **"Lint, tipos, testes, build e migrações"**. Assim só código aprovado pelo CI chega à `main` e, portanto, à produção.
5. **Serviços que apontam para o domínio**: callback do Google OAuth (`https://<domínio>/api/auth/callback/google`), webhook do Asaas de produção (`/api/webhooks/asaas`) e o Worker do cron (`/api/cron/delete-expired-cnh`, Bearer `CRON_SECRET`).

## Testar a imagem de produção localmente

`pnpm docker:prod` sobe o build standalone num container com os segredos de `development` (aplica as migrações ao subir). Serve para conferir o build de produção sem publicar nada; a Vercel não usa essa imagem.
