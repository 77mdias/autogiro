import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit não lê o .env.local como o Next; em CI as variáveis já vêm do ambiente
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrações usam o session pooler (porta 5432); o de transação (6543) não serve para DDL longo
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL! },
});
