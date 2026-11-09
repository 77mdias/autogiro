# Desenvolvimento

## Setup

O app só roda em container, com os segredos do Criptenv ([segredos.md](segredos.md)). Não existe `.env` no disco.

```bash
pnpm install                         # no host, só para editor, testes, lint e typecheck
pnpm docker:up                       # http://localhost:3000, com hot reload
pnpm docker:exec pnpm db:migrate     # aplica drizzle/*.sql no Supabase (DATABASE_URL_DIRECT)
```

### Hot reload no container

`pnpm docker:up` sobe o alvo `dev` do `Dockerfile` (`next dev`) pelo `compose.dev.yaml`, com o [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/):

- Salvou algo em `src/`, `public/`, `drizzle/` ou `scripts/`: o arquivo é copiado para o container e o Next recarrega a página.
- `next.config.ts` ou `tsconfig.json`: copia e reinicia o container.
- `package.json` ou `pnpm-lock.yaml`: refaz a imagem (dependência nova entra sozinha).

O container não monta a pasta do projeto: ele recebe cópias e não consegue escrever nos arquivos do host. O cache do Turbopack fica no volume `next-dev`. `Ctrl+C` para o watch; `docker compose -f compose.dev.yaml down` derruba o container.

Para testar a imagem de produção (standalone, sem hot reload): `pnpm docker:prod`. Ela usa o mesmo serviço e a mesma porta e substitui o container de dev.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm docker:up` | Container de dev com hot reload e os segredos do Criptenv (credenciais do chaveiro) |
| `pnpm docker:prod` | Imagem de produção (standalone) com os mesmos segredos |
| `pnpm docker:exec <comando>` | Roda o comando dentro do container de dev, com os segredos |
| `pnpm lint` / `pnpm test` / `pnpm typecheck` | No host; não precisam de segredo (`typecheck` gera os tipos das rotas com `next typegen` antes do `tsc`) |
| `pnpm db:generate` | Gera migração a partir do `schema.ts` (no host, sem segredo) |
| `pnpm docker:exec pnpm db:migrate` | Aplica as migrações |
| `pnpm docker:exec pnpm loja listar \| liberar <slug> [cus_...] \| pausar <slug>` | Operação manual do plano (fase 1), no banco de dev |
| `pnpm loja:prod listar \| liberar <slug> [cus_...] \| pausar <slug>` | O mesmo no banco de produção (chave `api-key-production` no chaveiro, [segredos.md](segredos.md)) |
| `pnpm tunnel -- --url=<dominio>` | ngrok para a porta 3000 |

## Variáveis de ambiente

Todas listadas e comentadas em `.env.example`, e cadastradas no Criptenv (um conjunto por ambiente). As que mudam entre ambientes:

| Variável | Dev (ngrok) | Produção |
|---|---|---|
| `APP_BASE_URL` | `https://<dominio>.ngrok-free.dev` (com `https://`, sem barra no fim) | domínio final |
| `AUTH_URL` | igual ao `APP_BASE_URL` | opcional |
| `ASAAS_API_URL` | Sandbox | produção |
| `ASAAS_CHECKOUT` | `on` para testar a fase 2 | vazio na fase 1 |
| `EMAIL_FROM` | `AutoGiro <nao-responda@77mdevseven.tech>` | o mesmo, ou um domínio próprio do AutoGiro quando existir |

## ngrok (túnel em dev)

Instalado em `~/.local/bin/ngrok`, authtoken em `~/.config/ngrok/ngrok.yml`. Domínio fixo atual: `await-creation-manger.ngrok-free.dev`.

1. Terminal 1: `pnpm docker:up`. Terminal 2: `pnpm tunnel -- --url=await-creation-manger.ngrok-free.dev`.
2. Abra o app **pelo domínio do ngrok** (o cookie do login fica nele).
3. No Google Cloud, o domínio está nas origens JavaScript e o callback `https://<dominio>/api/auth/callback/google` nos redirecionamentos (adicionados, sem apagar os de `localhost`).
4. O webhook do Asaas Sandbox aponta para `https://<dominio>/api/webhooks/asaas`.

`next.config.ts` libera os domínios do ngrok em `allowedDevOrigins`.

## Migrações

Altere `src/lib/db/schema.ts` e rode `pnpm db:generate` **no host** (só compara o schema com `drizzle/meta`, sem banco nem segredo; precisa de terminal interativo quando pergunta sobre renomear coluna). Não há passo manual depois:

- **Dev:** o watch leva o SQL novo de `drizzle/` para o container, que reinicia e aplica as migrações ao subir (`MIGRAR_AO_SUBIR=1`, `src/instrumentation.ts`). Se a migração falhar, o container não sobe e o erro aparece no log.
- **Produção:** depois do merge na `main`, o build da Vercel aplica as migrações antes do `next build` ([deploy.md](deploy.md)).
- **Esqueceu o `db:generate`?** O CI do PR falha no passo "Schema sem migração pendente".

`pnpm docker:exec pnpm db:migrate` continua disponível para aplicar na mão. O Supabase de dev já tem todas, até `0003_conta_email`.

## Armadilhas conhecidas

- **Chave do Asaas começa com `$`.** No Criptenv guarde o valor real, sem barra: `criptenv set 'ASAAS_API_KEY=$aact_...'` (aspas simples, para o shell não expandir o `$`).
- **`pnpm docker:exec` fora de um terminal** (agente, script): use `docker compose -f compose.dev.yaml exec -T app entrypoint.sh <comando>`; sem `-T` o Compose pede um TTY.
- **Login quebrado com 500 sem corpo em `/api/auth/*`.** O `AUTH_URL` não é uma URL válida (falta `https://`, tem aspas, espaço ou comentário colado). O `next-auth` faz `new URL(AUTH_URL)` sem tratar o erro. Vale para qualquer ambiente; na Vercel, corrija e faça Redeploy.
- **`redirect_uri_mismatch` no Google pelo ngrok.** Faltou `AUTH_URL` com o domínio do ngrok.
- **Erro "uncached data during prerendering or a navigation".** A página do painel precisa do seu próprio `loading.tsx`.
- **`AUTOGIRO_WHATSAPP`** sem `+55`: o app acrescenta o 55.
- **Conexão direta do Supabase** (`db.<ref>.supabase.co`) é só IPv6; use o session pooler nas migrações.

## Git

Branch por mudança → PR → CI (GitHub Actions) e prévia da Vercel → merge na `main` → deploy de produção automático ([deploy.md](deploy.md)).

Branch `main`, remoto `origin` (`github.com/77mdias/autogiro`). `.env*` ignorado, exceto `.env.example`.
