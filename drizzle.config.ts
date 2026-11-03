import { defineConfig } from "drizzle-kit";

// Variáveis vêm do Criptenv: rode pelo container (`pnpm docker:exec pnpm db:migrate`).

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrações usam o session pooler (porta 5432); o de transação (6543) não serve para DDL longo
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL! },
});
