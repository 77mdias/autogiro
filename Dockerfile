# syntax=docker/dockerfile:1
# Build sem nenhum segredo: o app só lê variáveis em execução, e elas chegam do Criptenv no start
# (docker/entrypoint.sh). Veja docs/segredos.md.
# Alvos: `dev` (next dev com hot reload, compose.dev.yaml) e `runtime`, o último e padrão
# (standalone de produção, compose.yaml).

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

# CLI do Criptenv e o entrypoint que injeta os segredos: base comum do dev e do runtime
FROM node:24-bookworm-slim AS criptenv
ARG CRIPTENV_VERSION=0.2.3
ENV NEXT_TELEMETRY_DISABLED=1 PATH=/opt/criptenv/bin:$PATH
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
 && python3 -m venv /opt/criptenv \
 && /opt/criptenv/bin/pip install --no-cache-dir "criptenv==${CRIPTENV_VERSION}" \
 && apt-get purge -y python3-venv && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

FROM base AS deps
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /src
COPY --from=deps /src/node_modules ./node_modules
COPY . .
RUN pnpm build

# Dev: o Compose Watch (compose.dev.yaml) copia o código editado no host para cá e o next dev recarrega.
# O container não monta a pasta do projeto: não consegue escrever nos arquivos do host.
FROM criptenv AS dev
ENV NODE_ENV=development PORT=3000 COREPACK_HOME=/home/node/.cache/node/corepack
RUN corepack enable && mkdir -p /app/.next && chown -R node:node /app
WORKDIR /app
USER node
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-dev,target=/home/node/.local/share/pnpm/store,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile
COPY --chown=node:node . .
EXPOSE 3000
CMD ["node_modules/.bin/next", "dev"]

FROM criptenv AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /src/.next/standalone ./
COPY --from=build --chown=node:node /src/.next/static ./.next/static
COPY --from=build --chown=node:node /src/public ./public
USER node
EXPOSE 3000
CMD ["node", "/app/server.js"]
