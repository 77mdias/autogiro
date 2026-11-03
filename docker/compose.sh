#!/bin/sh
# docker compose com as credenciais do Criptenv tiradas do chaveiro do sistema (nunca de arquivo).
# O Compose as entrega ao container como Docker secrets; veja docs/segredos.md.
set -eu
CRIPTENV_API_KEY="$(secret-tool lookup service criptenv project autogiro item api-key || true)"
CRIPTENV_VAULT_PASSWORD="$(secret-tool lookup service criptenv project autogiro item vault-password || true)"
if [ -z "$CRIPTENV_API_KEY" ] || [ -z "$CRIPTENV_VAULT_PASSWORD" ]; then
  echo "Credenciais do Criptenv não estão no chaveiro. Veja docs/segredos.md, passo 5." >&2
  exit 1
fi
export CRIPTENV_API_KEY CRIPTENV_VAULT_PASSWORD
exec docker compose "$@"
