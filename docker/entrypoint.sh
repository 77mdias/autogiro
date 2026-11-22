#!/bin/sh
# Credenciais do Criptenv vêm dos Docker secrets (/run/secrets), não do ambiente do container.
# `criptenv run` (0.2.3+) autentica pela API key sem gravar sessão, tira as credenciais do ambiente
# do app e faz exec do comando: o CMD da imagem (migrações e vite dev) ou o que vier depois
# do entrypoint num `docker compose exec` (ex.: `entrypoint.sh pnpm db:migrate`). O processo recebe
# o SIGTERM do `docker stop` direto.
set -eu
CRIPTENV_API_KEY="$(cat /run/secrets/criptenv_api_key)"
CRIPTENV_VAULT_PASSWORD="$(cat /run/secrets/criptenv_vault_password)"
export CRIPTENV_API_KEY CRIPTENV_VAULT_PASSWORD HOME=/tmp
# Em development o banco é o Postgres do compose (BANCO_LOCAL), por cima do que vier do Criptenv.
# `pnpm loja:prod` roda com CRIPTENV_ENV=production e fica com o banco de produção.
if [ "$CRIPTENV_ENV" = development ] && [ -n "${BANCO_LOCAL:-}" ]; then
  exec criptenv run -e "$CRIPTENV_ENV" -p "$CRIPTENV_PROJECT" -- env DATABASE_URL="$BANCO_LOCAL" DATABASE_URL_DIRECT="$BANCO_LOCAL" "$@"
fi
exec criptenv run -e "$CRIPTENV_ENV" -p "$CRIPTENV_PROJECT" -- "$@"
