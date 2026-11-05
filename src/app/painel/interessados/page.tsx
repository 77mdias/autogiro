import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { Car, Users } from "lucide-react";
import { db } from "@/lib/db";
import { carros, membros, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { formatPhone, whatsappUrl } from "@/lib/masks";
import { fotoUrl } from "@/lib/r2";
import { requireMembro } from "@/lib/session";
import { cn, formatBRL } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { distribuirLead } from "../actions";
import { LeadActions } from "./lead-actions";

export const metadata: Metadata = { title: "Interessados" };

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "novo", rotulo: "Novos" },
  { valor: "em_contato", rotulo: "Respondidos" },
] as const;
type Filtro = (typeof FILTROS)[number]["valor"];

const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

// Página dinâmica (sessão), então o "agora" é sempre o da requisição
function recebido(d: Date) {
  const min = Math.round((Date.now() - d.getTime()) / 60_000);
  if (min < 60) return rtf.format(-Math.max(min, 1), "minute");
  if (min < 60 * 24) return rtf.format(-Math.round(min / 60), "hour");
  if (min < 60 * 24 * 7) return rtf.format(-Math.round(min / 1440), "day");
  return dataCurta.format(d);
}

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

const nomeMembro = (nome: string | null, papel: string | null) => nome ?? (papel === "gestor" ? "Gestor" : "Vendedor");

export default async function InteressadosPage({ searchParams }: PageProps<"/painel/interessados">) {
  const { lojaId, membroId, papel } = await requireMembro("/painel/interessados");
  const gestor = papel === "gestor";
  const sp = await searchParams;
  const filtro: Filtro = sp.status === "novo" || sp.status === "em_contato" ? sp.status : "todos";

  // Vendedor vê a própria carteira; o gestor vê a loja toda (age só nos dele)
  const escopo = gestor ? eq(sim.lojaId, lojaId) : and(eq(sim.lojaId, lojaId), eq(sim.responsavelId, membroId))!;
  const onde: SQL[] = [escopo];
  if (filtro !== "todos") onde.push(eq(sim.status, filtro));

  const [porStatus, vendedores, leads] = await Promise.all([
    db.select({ status: sim.status, n: count() }).from(sim).where(escopo).groupBy(sim.status),
    gestor
      ? db
          .select({ id: membros.id, nome: membros.nome })
          .from(membros)
          .where(and(eq(membros.lojaId, lojaId), eq(membros.papel, "vendedor"), eq(membros.ativo, true)))
          .orderBy(membros.nome)
      : [],
    db
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
        precoCentavos: carros.precoCentavos,
        fotos: carros.fotos,
        responsavelId: sim.responsavelId,
        responsavelNome: membros.nome,
        responsavelPapel: membros.papel,
      })
      .from(sim)
      .leftJoin(carros, eq(carros.id, sim.carroId))
      .leftJoin(membros, eq(membros.id, sim.responsavelId))
      .where(and(...onde))
      .orderBy(desc(sim.createdAt)),
  ]);

  const total: Record<Filtro, number> = { todos: 0, novo: 0, em_contato: 0 };
  for (const r of porStatus) {
    if (r.status === "novo" || r.status === "em_contato") total[r.status] = r.n;
    total.todos += r.n;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8">
      <header className="grid gap-1">
        <h1 className="font-display text-3xl font-semibold lg:text-[2.5rem]">Interessados</h1>
        <p className="text-ink-3">
          {total.novo === 0
            ? "Nenhuma simulação esperando resposta."
            : total.novo === 1
              ? "1 simulação nova recebida pela vitrine."
              : `${total.novo} simulações novas recebidas pela vitrine.`}
        </p>
      </header>

      {total.todos > 0 && (
        <nav aria-label="Filtrar por situação" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <ul className="flex w-max gap-2">
            {FILTROS.map((f) => {
              const ativo = f.valor === filtro;
              return (
                <li key={f.valor}>
                  <Link
                    href={f.valor === "todos" ? "/painel/interessados" : `/painel/interessados?status=${f.valor}`}
                    aria-current={ativo ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap transition-colors duration-(--dur-micro) motion-reduce:transition-none",
                      ativo ? "border-ink bg-ink text-paper" : "border-rule-2 text-ink-2 hover:border-ink",
                    )}
                  >
                    {f.rotulo}
                    <span className="num">{total[f.valor]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {leads.length === 0 ? (
        <section className="ticks grid justify-items-start gap-4 px-6 py-12 lg:py-16">
          <Users className="size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
          <h2 className="font-display text-2xl font-light">
            {total.todos === 0 ? "Ninguém simulou ainda" : "Nada nesta situação"}
          </h2>
          <p className="max-w-[48ch] text-ink-2">
            {total.todos === 0
              ? "Quando um cliente pedir financiamento na sua vitrine, o pedido chega aqui com a CNH e o WhatsApp dele."
              : "Troque o filtro para ver as outras simulações."}
          </p>
        </section>
      ) : (
        <ul className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-10">
          {leads.map((l) => {
            const carro = l.modelo ? `${l.marca} ${l.modelo} ${l.ano}` : null;
            const meu = l.responsavelId === membroId;
            return (
              <li key={l.id}>
                <article className="grid h-full grid-cols-1 content-start gap-4 border-t border-rule-2 pt-5">
                  <header className="flex items-start gap-3">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-full bg-paper-3 font-display text-md text-ink-2"
                      aria-hidden
                    >
                      {iniciais(l.nome)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg leading-snug font-normal">{l.nome}</h2>
                      <p className="flex flex-wrap gap-x-3 text-sm text-ink-3">
                        <time dateTime={l.createdAt.toISOString()}>{recebido(l.createdAt)}</time>
                        <span className="num">{formatPhone(l.telefone)}</span>
                      </p>
                    </div>
                    {l.status === "novo" && (
                      <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-signal px-3 text-xs text-signal">
                        Novo
                      </span>
                    )}
                  </header>

                  <div className="flex items-center gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-card">
                      {l.fotos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2
                        <img src={fotoUrl(l.fotos[0])} alt="" className="absolute inset-0 size-full object-cover" />
                      ) : (
                        <Car className="absolute inset-0 m-auto size-6 text-ink-3" strokeWidth={1.5} aria-hidden />
                      )}
                    </div>
                    <p className="min-w-0">
                      <span className="block text-sm text-ink-3">Carro de interesse</span>
                      <span className="block truncate">{carro ?? "Carro removido do estoque"}</span>
                    </p>
                    {l.precoCentavos != null && (
                      <span className="num ml-auto shrink-0 text-sm text-ink-2">{formatBRL(l.precoCentavos)}</span>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-3 rounded-card bg-paper-2 p-4 sm:grid-cols-3">
                    <div className="min-w-0">
                      <dt className="text-sm text-ink-3">Entrada</dt>
                      <dd className="num truncate font-display text-lg">{formatBRL(l.valorEntradaCentavos)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-sm text-ink-3">A financiar</dt>
                      <dd className="num truncate font-display text-lg">{formatBRL(l.valorFinanciarCentavos)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-sm text-ink-3">Parcelas</dt>
                      <dd className="num font-display text-lg">{l.parcelas}x</dd>
                    </div>
                  </dl>

                  {meu ? (
                    <>
                      <LeadActions
                        id={l.id}
                        nome={l.nome}
                        temCnh={!!l.cnhKey}
                        whatsappHref={whatsappUrl(
                          l.telefone,
                          `Olá ${l.nome.split(" ")[0]}! Recebemos sua simulação de financiamento${carro ? ` do ${carro}` : ""}.`,
                        )}
                      />
                      {vendedores.length > 0 && (
                        <form action={distribuirLead} className="flex gap-2 border-t border-rule pt-3">
                          <input type="hidden" name="id" value={l.id} />
                          <label htmlFor={`para-${l.id}`} className="sr-only">
                            Passar {l.nome} para o vendedor
                          </label>
                          <select
                            id={`para-${l.id}`}
                            name="para"
                            required
                            defaultValue=""
                            className="h-12 min-w-0 flex-1 rounded-full border border-rule-2 bg-paper px-4 text-md outline-2 outline-offset-[-3px] outline-transparent focus-visible:outline-focus pointer-fine:h-10"
                          >
                            <option value="" disabled>
                              Passar para…
                            </option>
                            {vendedores.map((v) => (
                              <option key={v.id} value={v.id}>
                                {nomeMembro(v.nome, "vendedor")}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className={buttonVariants({ variant: "outline" })}>
                            Passar
                          </button>
                        </form>
                      )}
                    </>
                  ) : (
                    <p className="mt-auto flex h-12 items-center gap-2 rounded-full border border-dashed border-rule-2 px-5 text-sm text-ink-3 pointer-fine:h-10">
                      <Users className="size-5" aria-hidden /> Cliente de {nomeMembro(l.responsavelNome, l.responsavelPapel)}
                    </p>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
