# syntax=docker/dockerfile:1
# Build sem nenhum segredo: o app só lê variáveis em execução, e elas chegam do Criptenv no start
# (docker/entrypoint.sh). Veja docs/segredos.md.

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS deps
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /src
COPY --from=deps /src/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
ARG CRIPTENV_VERSION=0.2.3
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 PATH=/opt/criptenv/bin:$PATH
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
 && python3 -m venv /opt/criptenv \
 && /opt/criptenv/bin/pip install --no-cache-dir "criptenv==${CRIPTENV_VERSION}" \
 && apt-get purge -y python3-venv && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /src/.next/standalone ./
COPY --from=build --chown=node:node /src/.next/static ./.next/static
COPY --from=build --chown=node:node /src/public ./public
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
USER node
EXPOSE 3000
ENTRYPOINT ["entrypoint.sh"]
