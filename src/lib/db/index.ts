import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// prepare: false só se a URL for de um pooler de transação (porta 6543 do Supabase), que não aceita prepared
// statements. Hoje nenhum ambiente usa: o dev é Postgres em container e a produção, o Hyperdrive.
// No Hyperdrive (produção) prepare: false deixa consulta pendurada; a Cloudflare pede prepared statements.
// max 5: o Better Auth segura uma conexão numa transação enquanto chama ganchos que também consultam.
// postgres fixo em 3.4.9: a 4.x manda consultas além do `max` sem esperar a anterior, e pelo Hyperdrive elas nunca
// respondem (porsager/postgres#1319: o painel da loja, com 7 consultas em paralelo, travava).
const criar = (url: string) =>
  drizzle(postgres(url, { prepare: !/:6543\//.test(url), max: 5, fetch_types: false }), { schema });
type Db = ReturnType<typeof criar>;

/**
 * No Worker, uma conexão aberta num pedido não pode ser usada em outro ("Cannot perform I/O on behalf of a
 * different request"). A entrada do Worker (worker/index.ts) abre um escopo por pedido com a URL do Hyperdrive,
 * e o cliente nasce na primeira consulta dele. Fora de um pedido (scripts em Node) vale um cliente só.
 */
export const pedidoDb = new AsyncLocalStorage<{ url: string; db?: Db }>();
let unico: Db | undefined;

function atual(): Db {
  const pedido = pedidoDb.getStore();
  if (pedido) return (pedido.db ??= criar(pedido.url));
  return (unico ??= criar(process.env.DATABASE_URL!));
}

// Mesmo `db` de sempre para quem importa; cada acesso resolve o cliente do pedido em curso.
export const db = new Proxy({} as Db, {
  get(_, chave) {
    const alvo = atual();
    const valor = Reflect.get(alvo, chave, alvo);
    return typeof valor === "function" ? valor.bind(alvo) : valor;
  },
});
