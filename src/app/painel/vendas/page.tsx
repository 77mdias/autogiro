import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { ChevronLeft, ChevronRight, HandCoins } from "lucide-react";
import { db } from "@/lib/db";
import { membros, vendas } from "@/lib/db/schema";
import { requireMembro } from "@/lib/session";
import { formatBRL } from "@/lib/utils";
import { intervaloMes, mesDe, mesValido, mesVizinho, percentual, resumoPorVendedor } from "@/lib/vendas";
import { ComissaoForm } from "./comissao-form";

export const metadata: Metadata = { title: "Vendas" };

const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
const pct = (n: number | null) => (n == null ? "—" : `${n.toLocaleString("pt-BR")}%`);

export default async function VendasPage({ searchParams }: PageProps<"/painel/vendas">) {
  const { lojaId, membroId, papel } = await requireMembro("/painel/vendas");
  const gestor = papel === "gestor";
  const { mes: mesParam } = await searchParams;
  const atual = mesDe(new Date());
  const mes = mesValido(mesParam) ? mesParam : atual;
  const { inicio, fim } = intervaloMes(mes);
  const doMes = and(eq(vendas.lojaId, lojaId), gte(vendas.vendidaEm, inicio), lt(vendas.vendidaEm, fim));

  // A comissão nunca sai do servidor para o vendedor: a consulta dele nem lê a coluna.
  const lista = gestor
    ? await db
        .select({
          id: vendas.id,
          carro: vendas.carro,
          vendidaEm: vendas.vendidaEm,
          valorCentavos: vendas.valorCentavos,
          comissaoCentavos: vendas.comissaoCentavos,
          membroId: vendas.membroId,
          nome: membros.nome,
          papel: membros.papel,
        })
        .from(vendas)
        .leftJoin(membros, eq(membros.id, vendas.membroId))
        .where(doMes)
        .orderBy(desc(vendas.vendidaEm))
    : [];
  const minhas = gestor
    ? []
    : await db
        .select({ id: vendas.id, carro: vendas.carro, vendidaEm: vendas.vendidaEm, valorCentavos: vendas.valorCentavos })
        .from(vendas)
        .where(and(doMes, eq(vendas.membroId, membroId)))
        .orderBy(desc(vendas.vendidaEm));

  const comVendedor = lista.map((v) => ({ ...v, vendedor: v.nome ?? (v.papel === "gestor" ? "Gestor" : "Vendedor") }));
  const resumo = resumoPorVendedor(comVendedor);
  const total = (gestor ? lista : minhas).reduce((s, v) => s + v.valorCentavos, 0);
  const comissoes = lista.reduce((s, v) => s + (v.comissaoCentavos ?? 0), 0);
  const quantas = gestor ? lista.length : minhas.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="font-display text-3xl font-semibold lg:text-[2.5rem]">{gestor ? "Vendas e comissões" : "Minhas vendas"}</h1>
          <p className="text-ink-3 first-letter:uppercase">{nomeMes.format(inicio)}</p>
        </div>
        <nav aria-label="Trocar de mês" className="flex gap-2">
          <Link href={`/painel/vendas?mes=${mesVizinho(mes, -1)}`} className="grid size-11 place-items-center rounded-full border border-rule-2 hover:border-ink" aria-label="Mês anterior">
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          {mes < atual && (
            <Link href={`/painel/vendas?mes=${mesVizinho(mes, 1)}`} className="grid size-11 place-items-center rounded-full border border-rule-2 hover:border-ink" aria-label="Mês seguinte">
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          )}
        </nav>
      </header>

      <dl className="grid grid-cols-2 border-y border-rule sm:grid-cols-3">
        <div className="py-5 pr-4">
          <dt className="text-sm text-ink-3">Carros vendidos</dt>
          <dd className="num font-display text-3xl font-semibold">{quantas}</dd>
        </div>
        <div className="border-l border-rule px-4 py-5">
          <dt className="text-sm text-ink-3">Total vendido</dt>
          <dd className="num truncate font-display text-3xl font-semibold">{formatBRL(total)}</dd>
        </div>
        {gestor && (
          <div className="col-span-2 border-t border-rule py-5 sm:col-span-1 sm:border-t-0 sm:border-l sm:px-4">
            <dt className="text-sm text-ink-3">Comissões</dt>
            <dd className="num truncate font-display text-3xl font-semibold">
              {formatBRL(comissoes)} <span className="text-lg font-normal text-ink-3">{pct(percentual(comissoes, total))}</span>
            </dd>
          </div>
        )}
      </dl>

      {quantas === 0 ? (
        <section className="ticks grid justify-items-start gap-4 px-6 py-12 lg:py-16">
          <HandCoins className="size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
          <h2 className="font-display text-2xl font-light">Nenhuma venda neste mês</h2>
          <p className="max-w-[48ch] text-ink-2">
            {gestor
              ? "Quando um carro for marcado como vendido, a venda aparece aqui com quem vendeu. Você define a comissão de cada uma."
              : "Ao marcar um carro como vendido, informe o valor; depois que o gestor aprovar, a venda aparece aqui."}
          </p>
        </section>
      ) : gestor ? (
        <>
          {resumo.length > 1 && (
            <section aria-labelledby="por-vendedor" className="grid gap-3">
              <h2 id="por-vendedor" className="font-display text-xl font-semibold">
                Por vendedor
              </h2>
              <ul className="grid border-t border-rule">
                {resumo.map((r, i) => (
                  <li key={`${r.vendedor}-${i}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-rule py-3 sm:grid-cols-[minmax(0,1fr)_6rem_9rem_9rem]">
                    <span className="truncate">{r.vendedor}</span>
                    <span className="num text-ink-2 sm:text-right">
                      {r.vendas} {r.vendas === 1 ? "venda" : "vendas"}
                    </span>
                    <span className="num text-ink-2 sm:text-right">{formatBRL(r.valorCentavos)}</span>
                    <span className="num sm:text-right">
                      {formatBRL(r.comissaoCentavos)}
                      {r.semComissao > 0 && <span className="block text-xs text-ink-3">{r.semComissao} sem comissão</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="vendas-titulo" className="grid gap-3">
            <h2 id="vendas-titulo" className="font-display text-xl font-semibold">
              Vendas
            </h2>
            <ul className="grid border-t border-rule">
              {comVendedor.map((v) => (
                <li key={v.id} className="grid gap-3 border-b border-rule py-4 lg:grid-cols-[minmax(0,1fr)_9rem_auto] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate">{v.carro}</p>
                    <p className="text-sm text-ink-3">
                      {v.vendedor} · {dia.format(v.vendidaEm)}
                    </p>
                  </div>
                  <p className="num font-display text-lg lg:text-right">{formatBRL(v.valorCentavos)}</p>
                  <div className="flex items-start gap-3">
                    <ComissaoForm id={v.id} comissaoCentavos={v.comissaoCentavos} carro={v.carro} />
                    <span className="num mt-3 w-14 text-sm text-ink-3 pointer-fine:mt-2.5">{pct(percentual(v.comissaoCentavos, v.valorCentavos))}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <ul className="grid border-t border-rule">
          {minhas.map((v) => (
            <li key={v.id} className="flex items-center gap-3 border-b border-rule py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate">{v.carro}</p>
                <p className="text-sm text-ink-3">{dia.format(v.vendidaEm)}</p>
              </div>
              <p className="num font-display text-lg">{formatBRL(v.valorCentavos)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
