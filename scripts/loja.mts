// Administração manual do plano (fase de venda assistida). Roda com o Node direto:
//   npm run loja -- listar
//   npm run loja -- liberar <slug> [cus_...]   ativa o plano; com o cliente do Asaas, o webhook assume as próximas cobranças
//   npm run loja -- pausar <slug>              pausa painel e vitrine
import { existsSync } from "node:fs";
import postgres from "postgres";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não configurada");
const sql = postgres(url, { prepare: false, max: 1 });

const [comando, slug, cliente] = process.argv.slice(2);

try {
  if (comando === "listar") {
    const lojas = await sql`
      select slug, nome, plano_status, to_char(trial_ate at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as teste_ate,
             asaas_customer_id, asaas_subscription_id
      from lojas order by created_at`;
    console.table(lojas);
  } else if (comando === "liberar" && slug) {
    if (cliente && !/^cus_\w+$/.test(cliente)) throw new Error("O cliente do Asaas começa com cus_ (Clientes › detalhes no painel do Asaas)");
    const [loja] = await sql`
      update lojas set plano_status = 'ativo', asaas_customer_id = coalesce(${cliente ?? null}, asaas_customer_id)
      where slug = ${slug} returning slug, plano_status, asaas_customer_id`;
    if (!loja) throw new Error(`Loja ${slug} não encontrada`);
    console.table([loja]);
  } else if (comando === "pausar" && slug) {
    const [loja] = await sql`update lojas set plano_status = 'cancelado' where slug = ${slug} returning slug, plano_status`;
    if (!loja) throw new Error(`Loja ${slug} não encontrada`);
    console.table([loja]);
  } else {
    console.log("uso: npm run loja -- listar | liberar <slug> [cus_...] | pausar <slug>");
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
