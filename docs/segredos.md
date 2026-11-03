# Segredos (Criptenv)

Objetivo: nenhum `.env` com valores no disco. Os segredos ficam cifrados no [Criptenv](https://criptenv.77mdevseven.tech) e só existem em texto claro na memória do processo do app.

## Como o Criptenv funciona (o que importa aqui)

- **Zero-knowledge:** os valores são cifrados no cliente (AES-256-GCM) com chaves derivadas da **senha do cofre** do projeto. O servidor guarda só blobs cifrados; sem a senha do cofre ninguém lê, nem o Criptenv.
- **Projeto → ambientes** (`development`, `production`...). Cada ambiente tem seu conjunto de variáveis.
- **CLI em Python** (`pip install criptenv`, versão usada: 0.2.3). Sessão em `~/.criptenv/` (`auth.key` + `vault.db`); o fluxo normal não grava cópia dos segredos.
- **Acesso de máquina:** API key `cek_...` (permanente até revogar, escopo `read:secrets`, pode ser presa a um ambiente) ou CI token `ci_...` (sessão de 1 h, para pipelines).
- Para ler valores, uma máquina precisa de **duas** coisas: a API key **e** a senha do cofre. Uma sozinha não abre nada.

## Arquitetura no AutoGiro

```
host (chaveiro do sistema)            container (sem capabilities, usuário node)
  API key (read:secrets, 1 ambiente) ─► /run/secrets/criptenv_api_key ──────┐
  senha do cofre                     ─► /run/secrets/criptenv_vault_password ┤
                                                               docker/entrypoint.sh
                                       lê os dois arquivos e faz exec de
                                       criptenv run -e $CRIPTENV_ENV -p $CRIPTENV_PROJECT -- node server.js
                                       (o criptenv busca e decifra, tira as credenciais do ambiente e faz exec do node)
```

- **Build sem segredos:** o app não usa `NEXT_PUBLIC_*`; tudo é lido em execução. O `.dockerignore` tira qualquer `.env*` do contexto.
- **Docker secrets, não variáveis:** as credenciais chegam como arquivos em `/run/secrets`. Não aparecem em `docker inspect`; o `criptenv run` as remove do ambiente antes de iniciar o app.
- **Sem arquivo em texto claro:** com `CRIPTENV_API_KEY` a CLI autentica sem gravar sessão; `HOME=/tmp` (tmpfs).
- **Sinais:** `init: true` (tini) e uma cadeia de `exec` (sh → criptenv → node): `docker stop` chega direto ao node.
- **Endurecimento:** `cap_drop: ALL`, `no-new-privileges`, usuário `node`. Sem `read_only`: com secrets vindos do shell o Compose precisa gravá-los no container (só aceita `read_only` com secrets de arquivo do host).
- **Projeto:** `CRIPTENV_PROJECT` tem como padrão o ID do projeto `autogiro` (`659a2c2d-…`), que não é segredo.

Requer criptenv **0.2.3+** (a 0.2.2 repassava a senha do cofre para o app e não fazia `exec`; por isso havia um entrypoint em Node, removido).

## Configurar (uma vez)

1. **Instalar a CLI** na sua máquina: `pipx install criptenv` e `criptenv login`.
2. **Criar o projeto e os ambientes:**
   ```bash
   criptenv projects create autogiro      # define a senha do cofre: guarde num gerenciador de senhas
   criptenv env create development -p <ID>
   criptenv env create production -p <ID>
   ```
3. **Levar as variáveis** de `development` (os nomes estão em `.env.example`). Com `criptenv set` uma a uma, ou importando o `.env.local` atual:
   ```bash
   criptenv push .env.local -e development -p <ID>
   criptenv diff .env.local -e development -p <ID>   # confere
   ```
   Atenção à `ASAAS_API_KEY`: no `.env.local` ela está escrita como `\$aact_...` por causa do Next. No Criptenv o valor tem que ser o real, **sem a barra**: confira com `criptenv get ASAAS_API_KEY -e development -p <ID>` e, se preciso, `criptenv set 'ASAAS_API_KEY=$aact_...' -e development -p <ID>` (aspas simples, para o shell não expandir o `$`).
4. **Criar uma API key só de leitura por ambiente**, de preferência pela CLI, que já mostra o nome exato do ambiente: `criptenv api-keys create -p <ID> --name docker-dev --env development`. No painel, o campo de ambiente é texto livre: tem de ser o nome **exato** (`development`, minúsculo, sem espaço), senão a chave autentica mas não enxerga nenhum ambiente. Escopo `read:secrets`, `environment_scope` = `development` (outra para `production`).
5. **Guardar as duas credenciais no chaveiro do sistema** (GNOME Keyring, via `secret-tool`), não em arquivo:
   ```bash
   secret-tool store --label "criptenv autogiro api key" service criptenv project autogiro item api-key
   secret-tool store --label "criptenv autogiro vault"   service criptenv project autogiro item vault-password
   ```
6. **Apagar o `.env.local`** quando tudo estiver rodando pelo Criptenv: `shred -u .env.local`.

## Usar

O Criptenv só aceita o **ID** do projeto (UUID, em `criptenv projects list`), não o nome. Nos comandos abaixo, `<ID>` é esse valor.

| Para | Comando |
|---|---|
| Subir no Docker | `pnpm docker:up` (lê as credenciais do chaveiro e roda `docker compose up --build`) |
| Outro ambiente no Docker | `CRIPTENV_ENV=production pnpm docker:up` (com a API key de produção no chaveiro) |
| Dev local sem Docker | `criptenv use <ID>` uma vez; depois `pnpm dev:criptenv` (usa a sua sessão da CLI e pede a senha do cofre) |
| Qualquer comando com os segredos | `criptenv run -e development -p <ID> -- pnpm loja listar` (vale para `db:migrate` também) |
| Ver o que mudou | `criptenv diff <arquivo> -e development -p <ID>` |

No dev local, digite a senha do cofre no prompt em vez de exportar `CRIPTENV_VAULT_PASSWORD`: assim ela não fica no ambiente do shell nem no histórico.

## O que isso protege e o que não

- **Protege:** nenhum arquivo com segredos no projeto, que agentes, backups e `git` pudessem ler; imagem sem segredos (pode ir para um registry); credencial de máquina só de leitura, presa a um ambiente e revogável; nada no `docker inspect`.
- **Não protege:** quem tem acesso ao seu usuário enquanto a sessão está aberta. Um agente que rode comandos como você pode chamar `secret-tool lookup` ou ler o ambiente de um processo seu. Para reduzir: aprove comandos dos agentes, bloqueie o chaveiro quando não estiver usando, e prefira o prompt da senha do cofre.
- **Rotação:** trocar uma chave é `criptenv set` (ou `rotate`) + reiniciar o container. Revogar a API key corta o acesso de uma máquina sem mexer no resto.

## Testado

- Imagem construída sem nenhuma variável (`docker build`).
- 0.2.2, entrypoint antigo em Node com um `criptenv` simulado: credenciais só onde precisam, variáveis carregadas, `docker inspect` limpo, `docker stop` em 0,5 s.
- 0.2.3, com as credenciais reais do chaveiro (2026-11-02), pelo `docker compose up`:
  - a CLI autentica pela API key, busca e decifra o ambiente `development`, e faz `exec` do node;
  - `/`, `/login` e uma vitrine (que lê o Supabase) respondem 200;
  - `docker inspect` só mostra `CRIPTENV_PROJECT`/`CRIPTENV_ENV`; o ambiente do processo do app tem as variáveis do app e nenhuma credencial do Criptenv;
  - processos: `docker-init` (PID 1) → `next-server`, sem shell nem Python no meio;
  - `docker stop` em 0,6 s; `docker restart` volta normal;
  - `/tmp/.criptenv/vault.db` é criado vazio (só o esquema, em tmpfs).
- A primeira API key não enxergava ambiente nenhum: o escopo foi digitado como `developer` em vez de `development` (ponto 12).

`docker compose start`/`up` precisam das credenciais no shell: o Compose regrava os secrets a partir delas. Use sempre `pnpm docker:up`.

## Pontos a melhorar no Criptenv, vistos nesta integração

Corrigidos na 0.2.3 (conferido no código instalado e no repositório): 1, 2, 3, 4, 5, 6, 8, 9 e 10. Abertos: 12 e 13 (novos) e 7; o 11 (documentação) não foi conferido de novo.


1. `criptenv run` repassa `CRIPTENV_VAULT_PASSWORD`/`CRIPTENV_API_KEY` para o processo filho. Deveria removê-las do ambiente do filho.
2. `criptenv run` usa `subprocess.run` e fica como pai: não repassa SIGTERM (em Docker o app morre por SIGKILL após 10 s). Em POSIX, `os.execvpe` resolve.
3. `CRIPTENV_API_KEY` só vale no `login`; `run`/`export` não autenticam sozinhos e precisam gravar sessão em disco antes.
4. `export` sem segredos escreve "No secrets to export." no **stdout**, o que quebra quem lê JSON. Mensagens deveriam ir para o stderr.
5. `export` no formato `env` não põe aspas: valores com espaço, `#`, aspas ou quebra de linha saem quebrados.
6. Sem `CRIPTENV_VAULT_PASSWORD` e sem TTY, o `getpass` espera um prompt que nunca vem; deveria falhar com erro.
7. CLI só em Python: imagens Node precisam instalar Python (+92 MB nesta imagem). Um binário único ou imagem oficial ajudaria.
8. `-p/--project` diz aceitar "name or ID", mas o nome vai direto para a API, que responde `400 Invalid project ID`. Só o ID (UUID) funciona.
9. **`criptenv login` pelo navegador sempre falha com "State mismatch".** A CLI (0.2.2) só aceita o retorno se vier com o `state` que ela recebeu no `/initiate`, mas a página `apps/web/src/app/[locale]/cli-auth/page.tsx` (em `handleAuthorize`) monta o redirect só com `code`: `target.searchParams.set("code", authCode)`. Falta `target.searchParams.set("state", state)` logo abaixo. Enquanto isso, use `criptenv login --device` ou `criptenv login --api-key`.
10. A página de erro/sucesso do retorno da CLI manda `Content-Type: text/html` sem `charset=utf-8`; o travessão aparece como `â€”`. Basta `text/html; charset=utf-8` em `_send_success`/`_send_error` (`criptenv/commands/login.py`).
11. Documentação: a página "Conceitos" dá erro ao renderizar; `/docs/guides/migration` (no `llms.txt`) dá 404; o `llms.txt` aponta para `criptenv.dev`; prefixos e escopos divergem entre páginas (`ci_` x `cit_`, `secrets.read` x `read:secrets`, `/ci-tokens` x `/tokens` x `/v1/auth/ci-tokens`); a página da GitHub Action não diz onde entra a senha do cofre.
12. **Escopo de ambiente da API key sem validação.** O painel (`api-keys-panel.tsx`) e a API aceitam qualquer texto em `environment_scope`; a listagem de ambientes filtra por `env.name == environment_scope`. Um valor diferente do nome exato faz a chave autenticar e ver zero ambientes ("Environment 'development' not found"), sem pista do motivo. Sugestões: trocar o campo por um select dos ambientes do projeto, validar na API (`422` se não existir), e mostrar o escopo em `criptenv api-keys list`.
13. Com `CRIPTENV_API_KEY`, a CLI ainda cria `~/.criptenv/vault.db` (vazio). Não vaza nada, mas exige `HOME` gravável; nesse modo daria para não abrir o banco local.
