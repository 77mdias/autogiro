import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/**
 * Aplica as migrações pendentes de `drizzle/` (as já aplicadas ficam em drizzle.__drizzle_migrations;
 * é a mesma tabela do `drizzle-kit migrate`). Tudo numa transação: se uma falhar, nenhuma fica pela metade.
 */
export async function migrar() {
  // Session pooler (5432): o de transação (6543) não serve para DDL
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_DIRECT não configurada");
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await migrate(drizzle(sql), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } finally {
    await sql.end();
  }
}

/**
 * Migrações ao subir o servidor nos containers (src/instrumentation.ts): container novo = banco atualizado.
 * Se falhar, o processo sai: melhor parado do que rodando contra um banco velho.
 */
export async function migrarAoSubir() {
  try {
    await migrar();
    console.log("Migrações em dia");
  } catch (err) {
    console.error("Falha ao aplicar as migrações; o servidor não vai subir.", err);
    process.exit(1);
  }
}
