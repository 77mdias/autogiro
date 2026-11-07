# AutoGiro

PWA mobile-first para garagistas: estoque pelo celular, vitrine pública por loja e simulações de financiamento com CNH. A loja paga pelo Asaas uma mensalidade pelo tamanho da equipe (R$ 39 a R$ 169), com 15 dias grátis.

Produção na Vercel, migrando para **https://autogiro.wdias.tech**; até a troca terminar ([deploy.md](docs/deploy.md), passos 6 e 7), o app responde em `autogiro.77mdevseven.tech`. O que está pronto e o que falta: [docs/produto/estado.md](docs/produto/estado.md).

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 + shadcn/ui · Drizzle + Supabase Postgres · Auth.js (Google e e-mail) · Cloudflare R2 · Asaas · Resend · segredos no Criptenv.

## Rodar

O app só roda em container, com os segredos do Criptenv; não há `.env` no disco.

```bash
pnpm install          # no host: editor, testes, lint e tipos (nada disso precisa de segredo)
pnpm docker:up        # http://localhost:3000 com hot reload; aplica as migrações ao subir
pnpm test && pnpm typecheck && pnpm lint
```

Primeira vez: configure o Criptenv e o chaveiro ([docs/segredos.md](docs/segredos.md)). Conta de teste para o navegador: `E2E_EMAIL` / `E2E_SENHA` no `.env.example`.

## Trabalhar

Branch → PR → CI (GitHub Actions) e prévia da Vercel → merge na `main` → produção. A `main` é protegida: só entra por PR com o CI verde. Mudou o schema? `pnpm db:generate` e commite `drizzle/`; a migração se aplica sozinha no container e no deploy.

## Documentação

| Para | Leia |
|---|---|
| Saber o que existe e o que falta | [docs/produto/estado.md](docs/produto/estado.md) |
| Entender como o app funciona | [docs/arquitetura.md](docs/arquitetura.md), [docs/stack.md](docs/stack.md) |
| Rodar, testar, migrar | [docs/desenvolvimento.md](docs/desenvolvimento.md), [docs/testes.md](docs/testes.md) |
| Segredos e produção | [docs/segredos.md](docs/segredos.md), [docs/deploy.md](docs/deploy.md) |
| Cobrança | [docs/pagamentos-asaas.md](docs/pagamentos-asaas.md) |
| Visual | [DESIGN.md](DESIGN.md) (sistema travado) |
| Por que foi feito assim | [docs/decisoes.md](docs/decisoes.md) |

Índice completo e regras de manutenção: [docs/README.md](docs/README.md). Instruções para agentes de IA: [CLAUDE.md](CLAUDE.md).
