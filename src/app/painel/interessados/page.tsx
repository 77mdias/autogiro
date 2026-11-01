import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { carros, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { whatsappUrl } from "@/lib/masks";
import { requireLojaId } from "@/lib/session";
import { formatBRL } from "@/lib/utils";
import { LeadActions } from "./lead-actions";

export const metadata: Metadata = { title: "Interessados" };

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function InteressadosPage() {
  const lojaId = await requireLojaId("/painel/interessados");
  const leads = await db
    .select({
      id: sim.id,
      nome: sim.nome,
      telefone: sim.telefone,
      parcelas: sim.parcelas,
      valorEntradaCentavos: sim.valorEntradaCentavos,
      valorFinanciarCentavos: sim.valorFinanciarCentavos,
      cnhKey: sim.cnhKey,
      status: sim.status,
      createdAt: sim.createdAt,
      marca: carros.marca,
      modelo: carros.modelo,
      ano: carros.ano,
    })
    .from(sim)
    .leftJoin(carros, eq(carros.id, sim.carroId))
    .where(eq(sim.lojaId, lojaId))
    .orderBy(desc(sim.createdAt));

  return (
    <div className="grid grid-cols-1 gap-6">
      <h1 className="text-display-md">Interessados</h1>
      {leads.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhuma simulação ainda. Elas aparecem aqui quando um cliente pede financiamento pela sua vitrine.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {leads.map((l) => {
            const carro = l.modelo ? `${l.marca} ${l.modelo} ${l.ano}` : "Carro removido";
            return (
              <li key={l.id} className="grid grid-cols-1 gap-4 rounded-md bg-card p-4">
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sub-md">{l.nome}</p>
                    {l.status === "novo" && (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-caption font-semibold text-primary-foreground">Nova</span>
                    )}
                  </div>
                  <p className="text-body-md text-muted-foreground">
                    {carro} · {dataCurta.format(l.createdAt)}
                  </p>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-body-md">
                  <div>
                    <dt className="text-muted-foreground">Entrada</dt>
                    <dd className="font-semibold">{formatBRL(l.valorEntradaCentavos)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Financiar</dt>
                    <dd className="font-semibold">{formatBRL(l.valorFinanciarCentavos)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Parcelas</dt>
                    <dd className="font-semibold">{l.parcelas}x</dd>
                  </div>
                </dl>
                <LeadActions
                  id={l.id}
                  nome={l.nome}
                  temCnh={!!l.cnhKey}
                  whatsappHref={whatsappUrl(l.telefone, `Olá ${l.nome.split(" ")[0]}! Recebemos sua simulação de financiamento do ${carro}.`)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
