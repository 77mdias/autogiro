import type { Metadata } from "next";
import { and, asc, desc, eq } from "drizzle-orm";
import { ClipboardCheck } from "lucide-react";
import { db } from "@/lib/db";
import { carros, membros, pedidosEdicao as ped } from "@/lib/db/schema";
import { diferencas, type CamposCarro } from "@/lib/pedidos";
import { fotoUrl } from "@/lib/r2";
import { requireMembro } from "@/lib/session";
import { cn, formatBRL } from "@/lib/utils";
import { PedidoAcoes } from "./pedido-acoes";

export const metadata: Metadata = { title: "Pedidos" };

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function valor(campo: keyof CamposCarro, v: string | number | null) {
  if (v == null || v === "") return "—";
  if (campo === "precoCentavos") return formatBRL(Number(v));
  if (campo === "km") return `${Number(v).toLocaleString("pt-BR")} km`;
  if (campo === "status") return v === "vendido" ? "Vendido" : "Disponível";
  return String(v);
}

const SITUACAO = {
  pendente: { rotulo: "Esperando o gestor", cls: "border border-rule-2 text-ink-2" },
  aprovado: { rotulo: "Aprovado", cls: "border border-signal text-signal" },
  recusado: { rotulo: "Recusado", cls: "border border-error text-error" },
} as const;

export default async function PedidosPage() {
  const { lojaId, membroId, papel } = await requireMembro("/painel/pedidos");
  const gestor = papel === "gestor";

  // Gestor: o que está esperando decisão. Vendedor: os pedidos dele, os mais recentes primeiro.
  const pedidos = await db
    .select({
      id: ped.id,
      tipo: ped.tipo,
      status: ped.status,
      mudancas: ped.mudancas,
      createdAt: ped.createdAt,
      quemNome: membros.nome,
      carro: {
        id: carros.id,
        marca: carros.marca,
        modelo: carros.modelo,
        ano: carros.ano,
        km: carros.km,
        precoCentavos: carros.precoCentavos,
        cambio: carros.cambio,
        combustivel: carros.combustivel,
        cor: carros.cor,
        descricao: carros.descricao,
        status: carros.status,
        fotos: carros.fotos,
      },
    })
    .from(ped)
    .leftJoin(carros, eq(carros.id, ped.carroId))
    .innerJoin(membros, eq(membros.id, ped.membroId))
    .where(gestor ? and(eq(ped.lojaId, lojaId), eq(ped.status, "pendente")) : and(eq(ped.lojaId, lojaId), eq(ped.membroId, membroId)))
    .orderBy(gestor ? asc(ped.createdAt) : desc(ped.createdAt))
    .limit(gestor ? 100 : 30);

  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8">
      <header className="grid gap-1">
        <h1 className="font-display text-3xl font-semibold lg:text-[2.5rem]">Pedidos</h1>
        <p className="text-ink-3">
          {gestor
            ? "Alterações e exclusões que os vendedores pediram. O carro só muda quando você aprova."
            : "O que você pediu para mudar no estoque e o que o gestor decidiu."}
        </p>
      </header>

      {pedidos.length === 0 ? (
        <section className="ticks grid justify-items-start gap-4 px-6 py-12 lg:py-16">
          <ClipboardCheck className="size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
          <h2 className="font-display text-2xl font-light">{gestor ? "Nada esperando você" : "Nenhum pedido ainda"}</h2>
          <p className="max-w-[48ch] text-ink-2">
            {gestor
              ? "Quando um vendedor editar ou pedir para excluir um carro, o pedido aparece aqui."
              : "Ao editar um carro, a mudança vem para cá até o gestor aprovar."}
          </p>
        </section>
      ) : (
        <ul className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-10">
          {pedidos.map((p) => {
            const c = p.carro;
            const mudou = c && p.mudancas ? diferencas(c, p.mudancas) : [];
            const fotosNovas = p.mudancas?.fotosNovas ?? [];
            const fotosFora = p.mudancas?.fotosRemover.length ?? 0;
            const sit = SITUACAO[p.status];
            return (
              <li key={p.id}>
                <article className="grid h-full grid-cols-1 content-start gap-4 border-t border-rule-2 pt-5">
                  <header className="flex items-start gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-card bg-paper-2">
                      {c?.fotos[0] && (
                        // eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2
                        <img src={fotoUrl(c.fotos[0])} alt="" className="absolute inset-0 size-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg leading-snug font-normal">
                        {c ? `${c.marca} ${c.modelo} ${c.ano}` : "Carro que saiu do estoque"}
                      </h2>
                      <p className="text-sm text-ink-3">
                        {p.tipo === "excluir" ? "Pediu para excluir" : "Pediu para alterar"}
                        {gestor && ` · ${p.quemNome ?? "Vendedor"}`} ·{" "}
                        <time dateTime={p.createdAt.toISOString()}>{dataCurta.format(p.createdAt)}</time>
                      </p>
                    </div>
                    {!gestor && (
                      <span className={cn("inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs", sit.cls)}>{sit.rotulo}</span>
                    )}
                  </header>

                  {p.tipo === "editar" && p.status === "pendente" && (
                    <dl className="grid grid-cols-1 gap-3 rounded-card bg-paper-2 p-4">
                      {mudou.map((d) => (
                        <div key={d.campo} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                          <dt className="text-sm text-ink-3">{d.rotulo}</dt>
                          <dd className="min-w-0">
                            <span className="text-ink-3 line-through">{valor(d.campo, d.de)}</span>{" "}
                            <span aria-hidden>→</span> <span className="sr-only">para</span>
                            <span className="line-clamp-3">{valor(d.campo, d.para)}</span>
                          </dd>
                        </div>
                      ))}
                      {p.mudancas?.venda && (
                        <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                          <dt className="text-sm text-ink-3">Valor da venda</dt>
                          <dd className="num">{formatBRL(p.mudancas.venda.valorCentavos)}</dd>
                        </div>
                      )}
                      {fotosFora > 0 && (
                        <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                          <dt className="text-sm text-ink-3">Fotos removidas</dt>
                          <dd className="num">{fotosFora}</dd>
                        </div>
                      )}
                      {fotosNovas.length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          <dt className="text-sm text-ink-3">Fotos novas</dt>
                          <dd className="flex flex-wrap gap-2">
                            {fotosNovas.map((k) => (
                              // eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2
                              <img key={k} src={fotoUrl(k)} alt="" className="size-16 rounded-card object-cover" />
                            ))}
                          </dd>
                        </div>
                      )}
                      {mudou.length === 0 && fotosFora === 0 && fotosNovas.length === 0 && !p.mudancas?.venda && (
                        <p className="text-sm text-ink-3">Nenhuma diferença em relação ao carro de agora.</p>
                      )}
                    </dl>
                  )}

                  {gestor && <PedidoAcoes id={p.id} excluir={p.tipo === "excluir"} />}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
