import type { Metadata } from "next";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { convites, membros } from "@/lib/db/schema";
import { faixaPlano, MAX_VENDEDORES } from "@/lib/plano";
import { requireMembro } from "@/lib/session";
import { cn } from "@/lib/utils";
import { CancelarConvite, ConviteForm, VendedorAcoes } from "./equipe-acoes";

export const metadata: Metadata = { title: "Vendedores" };

const data = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export default async function VendedoresPage() {
  const { lojaId } = await requireMembro("/painel/vendedores", { soGestor: true });

  const [equipe, abertos] = await Promise.all([
    db
      .select({ id: membros.id, nome: membros.nome, ativo: membros.ativo, createdAt: membros.createdAt })
      .from(membros)
      .where(and(eq(membros.lojaId, lojaId), eq(membros.papel, "vendedor")))
      .orderBy(desc(membros.ativo), asc(membros.nome)),
    db
      .select({ id: convites.id, nome: convites.nome, expiraEm: convites.expiraEm })
      .from(convites)
      .where(and(eq(convites.lojaId, lojaId), gt(convites.expiraEm, new Date())))
      .orderBy(desc(convites.createdAt)),
  ]);
  const ativos = equipe.filter((v) => v.ativo).length;
  const usadas = ativos + abertos.length;
  const cheia = usadas >= MAX_VENDEDORES;
  const faixa = faixaPlano(ativos);
  // A faixa muda quando o próximo vendedor ativo passa do topo dela (convite em aberto ainda não paga).
  const proxima = ativos + 1 > faixa.ate && ativos < MAX_VENDEDORES ? faixaPlano(ativos + 1) : null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <header className="grid gap-1 lg:col-span-2">
        <h1 className="font-display text-3xl font-semibold lg:text-[2.5rem]">Vendedores</h1>
        <p className="text-ink-3">
          <span className="num">{ativos}</span> {ativos === 1 ? "vendedor ativo" : "vendedores ativos"}
          {abertos.length > 0 && (
            <>
              {" "}
              e <span className="num">{abertos.length}</span> {abertos.length === 1 ? "convite em aberto" : "convites em aberto"}
            </>
          )}{" "}
          · até <span className="num">{MAX_VENDEDORES}</span>
        </p>
        <p className="text-ink-3">
          Mensalidade: <span className="num text-ink-2">R$ {faixa.reais}</span> ({faixa.rotulo.toLowerCase()}).
          {proxima && (
            <>
              {" "}
              Com mais um vendedor ativo, passa a <span className="num">R$ {proxima.reais}</span> na próxima cobrança.
            </>
          )}
        </p>
      </header>

      <section aria-labelledby="equipe-titulo" className="grid min-w-0 content-start gap-4">
        <h2 id="equipe-titulo" className="font-display text-xl font-semibold">
          Equipe
        </h2>
        {equipe.length === 0 ? (
          <p className="ticks p-5 text-ink-2">
            Ninguém na equipe ainda. Gere um link de convite e mande para o vendedor pelo WhatsApp.
          </p>
        ) : (
          <ul className="grid border-t border-rule">
            {equipe.map((v) => (
              <li key={v.id} className="flex items-center gap-3 border-b border-rule py-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate", !v.ativo && "text-ink-3")}>{v.nome ?? "Vendedor"}</p>
                  <p className="text-sm text-ink-3">
                    {v.ativo ? "Ativo" : "Desativado"} · na equipe desde {data.format(v.createdAt)}
                  </p>
                </div>
                <VendedorAcoes id={v.id} nome={v.nome ?? "o vendedor"} ativo={v.ativo} />
              </li>
            ))}
          </ul>
        )}

        {abertos.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-medium text-ink-3">Convites em aberto</h3>
            <ul className="grid border-t border-rule">
              {abertos.map((c) => (
                <li key={c.id} className="flex items-center gap-3 border-b border-rule py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{c.nome}</p>
                    <p className="text-sm text-ink-3">Vale até {data.format(c.expiraEm)}</p>
                  </div>
                  <CancelarConvite id={c.id} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="convidar-titulo" className="ticks grid min-w-0 content-start gap-4 p-5 lg:p-6">
        <h2 id="convidar-titulo" className="font-display text-xl font-semibold">
          Convidar vendedor
        </h2>
        {cheia ? (
          <p className="text-ink-2">
            A loja chegou a {MAX_VENDEDORES} vendedores, contando os convites em aberto. Cancele um convite ou desative alguém
            para abrir vaga.
          </p>
        ) : (
          <p className="text-ink-2">
            Ele entra com Google ou e-mail e cai direto na sua loja. Vendedor cadastra carro; edição e exclusão passam por você.
          </p>
        )}
        <ConviteForm cheia={cheia} />
      </section>
    </div>
  );
}
