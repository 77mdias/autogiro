# Desenvolvimento

## Setup

O app só roda em container, com os segredos do Criptenv ([segredos.md](segredos.md)). Não existe `.env` no disco.

```bash
pnpm install                         # no host, só para editor, testes, lint e typecheck
pnpm docker:up                       # http://localhost:3000, com hot reload; aplica as migrações ao subir
```

### Banco de dev

Um Postgres 17 em container, o serviço `db` do `compose.dev.yaml`, sobe junto com o app (não é mais o Supabase). Os dados ficam no volume `banco` e sobrevivem a `down`; para zerar, `docker compose -f compose.dev.yaml down -v` (o próximo `docker:up` aplica as migrações de novo).

- Do host (DBeaver, psql, TablePlus): `postgres://autogiro:autogiro@localhost:5432/autogiro`. A senha não é segredo: o banco é descartável e só escuta em `127.0.0.1`.
- Dentro do container o app usa `db:5432`: `docker/entrypoint.sh` troca o `DATABASE_URL` e o `DATABASE_URL_DIRECT` do Criptenv por `BANCO_LOCAL` quando o ambiente é `development`. `pnpm loja:prod` roda com `production` e continua no banco de produção.
- Começa vazio: crie a conta pelo cadastro (o e-mail de confirmação sai pelo Resend) ou insira dados com `psql`.

### Hot reload no container

`pnpm docker:up` sobe o `Dockerfile` pelo `compose.dev.yaml`, com o [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/). O container aplica as migrações pendentes e roda `vite dev`: o vinext com o plugin da Cloudflare executa o app no **workerd**, o mesmo runtime da produção. Os segredos declarados em `cloudflare.config.ts` vêm do ambiente do container (Criptenv); o Hyperdrive, no dev, conecta direto no `DATABASE_URL`.

- Salvou algo em `src/`, `public/` ou `scripts/`: o arquivo é copiado para o container e o vite recarrega a página.
- `worker/`, `drizzle/`, `next.config.ts`, `vite.config.ts`, `cloudflare.config.ts` ou `tsconfig.json`: copia e reinicia o container (migração nova é aplicada ao subir).
- `package.json` ou `pnpm-lock.yaml`: refaz a imagem (dependência nova entra sozinha).

O container não monta a pasta do projeto: ele recebe cópias e não consegue escrever nos arquivos do host. `Ctrl+C` para o watch; `docker compose -f compose.dev.yaml down` derruba o container.

O primeiro acesso a cada página demora (o vite compila sob demanda); depois é rápido. Para testar o Worker construído: `pnpm docker:exec pnpm build` e `pnpm docker:exec pnpm preview` ([deploy.md](deploy.md)).

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm docker:up` | Container de dev com hot reload e os segredos do Criptenv (credenciais do chaveiro) |
| `pnpm docker:exec <comando>` | Roda o comando dentro do container de dev, com os segredos |
| `pnpm lint` / `pnpm test` / `pnpm typecheck` / `pnpm build` | No host; não precisam de segredo (`typecheck` gera os tipos das rotas com `next typegen` e os do Worker com `cf workers types` antes do `tsc`) |
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
| `AUTH_URL` | igual ao `APP_BASE_URL` | igual ao `APP_BASE_URL` (obrigatório: é a `baseURL` do Better Auth) |
| `ASAAS_API_URL` | Sandbox | produção |
| `ASAAS_CHECKOUT` | `on` para testar a fase 2 | `off` na fase 1 (sem valor, o deploy recusa) |
| `EMAIL_FROM` | `AutoGiro <nao-responda@77mdevseven.tech>` | o mesmo, ou um domínio próprio do AutoGiro quando existir |

## ngrok (túnel em dev)

Instalado em `~/.local/bin/ngrok`, authtoken em `~/.config/ngrok/ngrok.yml`. Domínio fixo atual: `await-creation-manger.ngrok-free.dev`.

1. Terminal 1: `pnpm docker:up`. Terminal 2: `pnpm tunnel -- --url=await-creation-manger.ngrok-free.dev`.
2. Abra o app **pelo domínio do ngrok** (o cookie do login fica nele).
3. No Google Cloud, o domínio está nas origens JavaScript e o callback `https://<dominio>/api/auth/callback/google` nos redirecionamentos (adicionados, sem apagar os de `localhost`).
4. O webhook do Asaas Sandbox aponta para `https://<dominio>/api/webhooks/asaas`.

`vite.config.ts` aceita os domínios do ngrok (`server.allowedHosts`) e `next.config.ts` os libera em `allowedDevOrigins`.

## Migrações

Altere `src/lib/db/schema.ts` e rode `pnpm db:generate` **no host** (só compara o schema com `drizzle/meta`, sem banco nem segredo; precisa de terminal interativo quando pergunta sobre renomear coluna). Não há passo manual depois:

- **Dev:** o watch leva o SQL novo de `drizzle/` para o container, que reinicia e aplica as migrações ao subir (`pnpm db:migrate` no CMD do `Dockerfile`). Se a migração falhar, o container não sobe e o erro aparece no log.
- **Produção:** depois do merge na `main`, o GitHub Actions aplica as migrações antes do deploy do Worker ([deploy.md](deploy.md)).
- **Esqueceu o `db:generate`?** O CI do PR falha no passo "Schema sem migração pendente".

`pnpm docker:exec pnpm db:migrate` continua disponível para aplicar na mão. Migração com dados (como a `0011`, que passa as contas para o Better Auth) leva o SQL escrito à mão no fim do arquivo gerado.

## Armadilhas conhecidas

- **Chave do Asaas começa com `$`.** No Criptenv guarde o valor real, sem barra: `criptenv set 'ASAAS_API_KEY=$aact_...'` (aspas simples, para o shell não expandir o `$`).
- **`pnpm docker:exec` fora de um terminal** (agente, script): use `docker compose -f compose.dev.yaml exec -T app entrypoint.sh <comando>`; sem `-T` o Compose pede um TTY.
- **`AUTH_URL` exato** (`https://`, sem barra, aspas, espaço ou comentário): é a `baseURL` do Better Auth e a origem aceita nos POSTs de `/api/auth/*`. No dev, entrar por `localhost` com `AUTH_URL` do ngrok faz o Better Auth recusar a origem: abra pelo domínio do ngrok.
- **`redirect_uri_mismatch` no Google pelo ngrok.** Faltou `AUTH_URL` com o domínio do ngrok.
- **`import { env } from "cloudflare:workers"`** só existe no Worker; o `next dev` não roda mais este app. Use `pnpm docker:up`.
- **Conexão de banco global** quebra no Worker ("Cannot perform I/O on behalf of a different request"): sempre pelo `db` de `src/lib/db`, que é por pedido.
- **`pnpm deploy`** sem `run` é um comando do próprio pnpm; o script é `pnpm run deploy`.
- **`AUTOGIRO_WHATSAPP`** sem `+55`: o app acrescenta o 55.
- **Conexão direta do Supabase** (`db.<ref>.supabase.co`) é só IPv6; use o session pooler nas migrações.

## Git

Branch por mudança → PR → CI (GitHub Actions) → merge na `main` → migrações e deploy do Worker pelo GitHub Actions ([deploy.md](deploy.md)).

Branch `main`, remoto `origin` (`github.com/77mdias/autogiro`). `.env*` ignorado, exceto `.env.example`.
