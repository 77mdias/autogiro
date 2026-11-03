#!/bin/sh
# Build na Vercel (vercel.json). Em produção, aplica as migrações antes do build: uma vez por deploy, não por
# instância de função. Se a migração falhar, o deploy aborta e a versão anterior continua no ar.
# Prévias de PR (VERCEL_ENV=preview) não migram: o banco de produção só muda depois do merge na main.
set -eu
if [ "${VERCEL_ENV:-}" = "production" ]; then
  pnpm db:migrate
fi
exec pnpm build
