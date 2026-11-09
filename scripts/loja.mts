// Administração manual do plano (fase de venda assistida). Roda em container, com os segredos do Criptenv.
// Em produção, troque `pnpm docker:exec pnpm loja` por `pnpm loja:prod` (container avulso, ambiente production).
//   pnpm docker:exec pnpm loja listar
//   pnpm docker:exec pnpm loja liberar <slug> [cus_...]   ativa o plano; com o cliente do Asaas, o webhook assume as próximas cobranças
//   pnpm docker:exec pnpm loja pausar <slug>              pausa painel e vitrine
//   pnpm docker:exec pnpm loja mensalidades [aplicar]     lista as assinaturas fora da faixa; com "aplicar", muda o valor no Asaas
import postgres from "postgres";
import { valorPlano } from "../src/lib/plano.ts";

// Variáveis vêm do Criptenv: rode pelo container (`pnpm docker:exec pnpm loja listar`).
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não configurada");
const sql = postgres(url, { prepare: false, max: 1 });

const [comando, slug, cliente] = process.argv.slice(2);

try {
  if (comando === "listar") {
    const lojas = await sql`
      select slug, nome, plano_status, to_char(trial_ate at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as teste_ate,
             asaas_customer_id, asaas_subscription_id, mensalidade_centavos
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
  } else if (comando === "mensalidades") {
    // Para as lojas do plano antigo (R$ 149) e para mudanças de faixa que o Asaas recusou na hora.
    // Avise as lojas antes: Minha loja já mostra "a partir da próxima cobrança, passa de X para Y".
    const lojas = await sql<{ id: string; slug: string; sub: string; atual: number | null; vendedores: number }[]>`
      select l.id, l.slug, l.asaas_subscription_id as sub, l.mensalidade_centavos as atual,
             (select count(*)::int from membros m where m.loja_id = l.id and m.papel = 'vendedor' and m.ativo) as vendedores
      from lojas l where l.asaas_subscription_id is not null order by l.created_at`;
    const fora = lojas.map((l) => ({ ...l, faixa: valorPlano(l.vendedores) * 100 })).filter((l) => l.atual !== l.faixa);
    console.table(fora.map(({ slug, vendedores, atual, faixa }) => ({ slug, vendedores, atual, faixa })));
    if (slug === "aplicar") {
      const key = process.env.ASAAS_API_KEY;
      if (!key) throw new Error("ASAAS_API_KEY não configurada");
      const api = process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3";
      // Mesmo pedido de mudarValorAssinatura (src/lib/asaas.ts, que é server-only e não roda aqui).
      for (const l of fora) {
        const res = await fetch(`${api}/subscriptions/${encodeURIComponent(l.sub)}`, {
          method: "PUT",
          headers: { access_token: key, "content-type": "application/json", "user-agent": "AutoGiro/1.0" },
          body: JSON.stringify({ value: l.faixa / 100, updatePendingPayments: true }),
        });
        if (!res.ok) {
          console.error(l.slug, "recusado pelo Asaas:", res.status, await res.text());
          continue;
        }
        await sql`update lojas set mensalidade_centavos = ${l.faixa} where id = ${l.id}`;
        console.log(l.slug, "→", l.faixa / 100);
      }
    }
  } else {
    console.log("uso: npm run loja -- listar | liberar <slug> [cus_...] | pausar <slug> | mensalidades [aplicar]");
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
