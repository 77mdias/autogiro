# syntax=docker/dockerfile:1
# Container de desenvolvimento: vite dev (vinext) rodando o Worker no workerd, com os segredos do Criptenv
# (docker/entrypoint.sh, docs/segredos.md). Produção não usa imagem: é o Worker na Cloudflare (docs/deploy.md).

FROM node:24-bookworm-slim AS dev
ARG CRIPTENV_VERSION=0.2.3
ENV PATH=/opt/criptenv/bin:$PATH NODE_ENV=development COREPACK_HOME=/home/node/.cache/node/corepack
# CLI do Criptenv e o entrypoint que injeta os segredos
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
 && python3 -m venv /opt/criptenv \
 && /opt/criptenv/bin/pip install --no-cache-dir "criptenv==${CRIPTENV_VERSION}" \
 && apt-get purge -y python3-venv && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

# O Compose Watch (compose.dev.yaml) copia o código editado no host para cá e o vite recarrega.
# O container não monta a pasta do projeto: não consegue escrever nos arquivos do host.
RUN corepack enable && mkdir -p /app && chown -R node:node /app
WORKDIR /app
USER node
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-dev,target=/home/node/.local/share/pnpm/store,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile
COPY --chown=node:node . .
EXPOSE 3000
# Migrações pendentes primeiro (container novo = banco atualizado); se falharem, o dev não sobe.
CMD ["sh", "-c", "pnpm db:migrate && exec pnpm dev"]
