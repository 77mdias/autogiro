import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

// Worker do AutoGiro (vinext na Cloudflare). Lido no dev (vite dev), no build e no deploy. docs/deploy.md
// Os segredos não ficam aqui: vêm do Criptenv (no dev, pelo ambiente do container; em produção, pela integração).

// Hyperdrive de produção (`cf hyperdrive create`, apontando para o session pooler do Supabase). Não é segredo.
const HYPERDRIVE_ID = "PREENCHER_NO_PRIMEIRO_DEPLOY";

// Valores no Criptenv (development e production). scripts/primeiro-deploy.mts usa a mesma lista.
export const segredos = [
  "AUTH_SECRET",
  "AUTH_URL",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "APP_BASE_URL",
  "ADMIN_EMAILS",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BUCKET",
  "R2_PUBLIC_URL",
  "R2_PRIVATE_BUCKET",
  "ASAAS_API_KEY",
  "ASAAS_API_URL",
  "ASAAS_CHECKOUT",
  "ASAAS_WEBHOOK_TOKEN",
  "AUTOGIRO_WHATSAPP",
] as const;

export default defineConfig({
  worker: defineWorker({
    name: "autogiro",
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-11-16",
    domains: ["autogiro.wdias.tech"],
    // Perto do Supabase (us-east-1): cada consulta é uma ida e volta ao banco.
    placement: { region: "aws:us-east-1" },
    observability: { enabled: true },
    // CNHs com mais de 90 dias saem do R2 todo dia às 06:00 UTC (src/lib/limpeza-cnh.ts).
    triggers: [triggers.scheduled({ schedule: "0 6 * * *" })],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      // No dev a conexão vai direto ao DATABASE_URL do Criptenv (pooler de transação do banco de dev).
      HYPERDRIVE: bindings.hyperdrive({ id: HYPERDRIVE_ID, dev: { connectionString: process.env.DATABASE_URL } }),
      ...Object.fromEntries(segredos.map((nome) => [nome, bindings.secret()])),
    },
  }),
});
