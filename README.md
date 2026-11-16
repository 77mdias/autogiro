# AutoGiro

PWA mobile-first para garagistas: estoque pelo celular, vitrine pública por loja e simulações de financiamento com CNH. A loja paga pelo Asaas uma mensalidade pelo tamanho da equipe (R$ 59 a R$ 169), com 15 dias grátis.

Produção em **https://autogiro.wdias.tech**, passando da Vercel para um Cloudflare Worker ([deploy.md](docs/deploy.md)). O que está pronto e o que falta: [docs/produto/estado.md](docs/produto/estado.md).

Next.js 16 (App Router) sobre vinext num Cloudflare Worker · TypeScript · Tailwind v4 + shadcn/ui · Drizzle + Supabase Postgres (Hyperdrive) · Better Auth (Google e e-mail) · Cloudflare R2 · Asaas · Resend · segredos no Criptenv.

## Rodar

O app só roda em container, com os segredos do Criptenv; não há `.env` no disco.

```bash
pnpm install          # no host: editor, testes, lint e tipos (nada disso precisa de segredo)
pnpm docker:up        # http://localhost:3000 com hot reload; aplica as migrações ao subir
pnpm test && pnpm typecheck && pnpm lint
```

Primeira vez: configure o Criptenv e o chaveiro ([docs/segredos.md](docs/segredos.md)). Conta de teste para o navegador: `E2E_EMAIL` / `E2E_SENHA` no `.env.example`.

## Trabalhar

Branch → PR → CI (GitHub Actions) → merge na `main` → migrações e deploy do Worker. A `main` é protegida: só entra por PR com o CI verde. Mudou o schema? `pnpm db:generate` e commite `drizzle/`; a migração se aplica sozinha no container e no deploy.

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
