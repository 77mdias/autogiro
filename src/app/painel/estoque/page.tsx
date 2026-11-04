import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, count, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { Car, ExternalLink, Images, Pencil, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { carros, lojas, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { fotoUrl } from "@/lib/r2";
import { requireLojaId } from "@/lib/session";
import { cn, formatBRL } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CopyLinkButton, ShareLinkButton } from "@/components/copy-link-button";
import { CarSpecs } from "@/components/car-specs";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Estoque" };

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "disponivel", rotulo: "Disponíveis" },
  { valor: "vendido", rotulo: "Vendidos" },
] as const;
type Filtro = (typeof FILTROS)[number]["valor"];

// Busca e filtro vivem na URL: dá para voltar, recarregar e compartilhar o mesmo recorte
const href = (status: Filtro, q: string) => {
  const p = new URLSearchParams();
  if (status !== "todos") p.set("status", status);
  if (q) p.set("q", q);
  const s = p.toString();
  return s ? `/painel/estoque?${s}` : "/painel/estoque";
};

export default async function EstoquePage({ searchParams }: PageProps<"/painel/estoque">) {
  const lojaId = await requireLojaId("/painel/estoque");
  const sp = await searchParams;
  const status: Filtro = sp.status === "disponivel" || sp.status === "vendido" ? sp.status : "todos";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";

  const filtros: SQL[] = [eq(carros.lojaId, lojaId)];
  if (status !== "todos") filtros.push(eq(carros.status, status));
  if (q) {
    // % e _ do usuário são literais, não curingas
    const termo = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    filtros.push(ilike(sql`concat_ws(' ', ${carros.marca}, ${carros.modelo}, ${carros.versao})`, termo));
  }

  const [[loja], [{ novas }], porStatus, lista] = await Promise.all([
    db.select({ slug: lojas.slug, nome: lojas.nome }).from(lojas).where(eq(lojas.id, lojaId)).limit(1),
    db.select({ novas: count() }).from(sim).where(and(eq(sim.lojaId, lojaId), eq(sim.status, "novo"))),
    db.select({ status: carros.status, n: count() }).from(carros).where(eq(carros.lojaId, lojaId)).groupBy(carros.status),
    db
      .select({
        id: carros.id,
        marca: carros.marca,
        modelo: carros.modelo,
        versao: carros.versao,
        ano: carros.ano,
        km: carros.km,
        cambio: carros.cambio,
        combustivel: carros.combustivel,
        precoCentavos: carros.precoCentavos,
        status: carros.status,
        fotos: carros.fotos,
      })
      .from(carros)
      .where(and(...filtros))
      .orderBy(asc(carros.status), desc(carros.createdAt)),
  ]);

  const total = { todos: 0, disponivel: 0, vendido: 0 };
  for (const r of porStatus) {
    total[r.status] = r.n;
    total.todos += r.n;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <h1 className="font-display text-3xl font-semibold lg:text-[2.5rem]">Estoque</h1>
          {loja && <p className="truncate text-ink-3">{loja.nome}</p>}
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-flow-col">
          <Link href="/painel/estoque/novo" className={buttonVariants({ className: "w-full sm:w-auto" })}>
            <Plus aria-hidden /> Cadastrar novo carro
          </Link>
          {loja && <CopyLinkButton path={`/loja/${loja.slug}`} className="w-full sm:w-auto" />}
        </div>
      </header>

      {novas > 0 && (
        <Link
          href="/painel/interessados"
          className="group flex items-center gap-4 rounded-card bg-navy p-5 text-navy-ink transition-transform duration-(--dur-micro) active:translate-y-px motion-reduce:transition-none lg:p-6"
        >
          <span className="num font-display text-[2.75rem] leading-none font-extralight">{novas}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg">
              {novas === 1 ? "Simulação nova esperando resposta" : "Simulações novas esperando resposta"}
            </span>
            <span className="block text-sm text-navy-ink-2">Os dados da simulação estão em Interessados. Responda pelo WhatsApp.</span>
          </span>
          <span className="hidden h-10 items-center rounded-full border border-navy-ink-2 px-4 text-sm group-hover:bg-navy-ink group-hover:text-navy sm:inline-flex">
            Ver interessados
          </span>
        </Link>
      )}

      {total.todos > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,24rem)_1fr] lg:items-center">
          <form role="search" action="/painel/estoque" className="relative">
            {status !== "todos" && <input type="hidden" name="status" value={status} />}
            <label htmlFor="q" className="sr-only">
              Buscar no estoque
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3" aria-hidden />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Buscar por marca, modelo ou versão"
              className="h-12 w-full rounded-full border border-rule-2 bg-paper pr-4 pl-12 text-md outline-2 outline-offset-[-3px] outline-transparent placeholder:text-ink-3 focus-visible:outline-focus pointer-fine:h-10"
            />
          </form>
          <nav aria-label="Filtrar por situação" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:justify-self-end lg:px-0">
            <ul className="flex w-max gap-2">
              {FILTROS.map((f) => {
                const ativo = f.valor === status;
                return (
                  <li key={f.valor}>
                    <Link
                      href={href(f.valor, q)}
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
        </div>
      )}

      {total.todos === 0 ? (
        <section className="ticks grid justify-items-start gap-4 px-6 py-12 lg:justify-items-center lg:py-20 lg:text-center">
          <Car className="size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
          <h2 className="font-display text-2xl font-light">Seu pátio ainda está vazio</h2>
          <p className="max-w-[44ch] text-ink-2">
            Cadastre o primeiro carro com fotos e preço. Ele aparece na hora na vitrine que você manda aos clientes.
          </p>
          <Link href="/painel/estoque/novo" className={buttonVariants()}>
            <Plus aria-hidden /> Cadastrar o primeiro carro
          </Link>
        </section>
      ) : lista.length === 0 ? (
        <section className="grid justify-items-start gap-3 py-10">
          <h2 className="font-display text-xl font-light">Nenhum carro encontrado</h2>
          <p className="text-ink-2">{q ? `Nada no estoque combina com “${q}”.` : "Nenhum carro nesta situação."}</p>
          <Link href="/painel/estoque" className={buttonVariants({ variant: "outline" })}>
            Ver todo o estoque
          </Link>
        </section>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {lista.map((c) => {
            const vendido = c.status === "vendido";
            return (
              <li key={c.id}>
                <article className="relative flex h-full flex-col overflow-hidden rounded-card border border-rule bg-paper transition-colors duration-(--dur-short) hover:border-rule-2 motion-reduce:transition-none">
                  <div className="relative aspect-[16/10] bg-paper-2">
                    {c.fotos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2
                      <img
                        src={fotoUrl(c.fotos[0])}
                        alt=""
                        className={cn("absolute inset-0 size-full object-cover", vendido && "grayscale")}
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <Car className="size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
                      </div>
                    )}
                    <StatusBadge status={c.status} className="absolute top-3 left-3" />
                    {c.fotos.length > 1 && (
                      <span className="absolute right-3 bottom-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-ink/80 px-2.5 text-xs text-paper">
                        <Images className="size-3.5" aria-hidden />
                        <span className="num">{c.fotos.length}</span>
                        <span className="sr-only">fotos</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 text-lg leading-snug font-normal">
                        <Link
                          href={`/painel/estoque/${c.id}`}
                          className="outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
                        >
                          {c.marca} {c.modelo}
                        </Link>
                        {c.versao && <span className="block truncate text-sm text-ink-3">{c.versao}</span>}
                      </h2>
                      <p className={cn("num shrink-0 font-display text-xl font-normal", vendido && "text-ink-3 line-through")}>
                        {formatBRL(c.precoCentavos)}
                      </p>
                    </div>
                    <CarSpecs carro={c} />
                    <div className="@container relative z-(--z-raised) mt-auto flex gap-2 border-t border-rule pt-3">
                      <Link href={`/painel/estoque/${c.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3" })}>
                        <Pencil aria-hidden /> Editar
                      </Link>
                      {loja && !vendido && (
                        <ShareLinkButton
                          path={`/loja/${loja.slug}/carros/${c.id}`}
                          title={`${c.marca} ${c.modelo}`}
                          variant="ghost"
                          size="sm"
                          labelClassName="@max-[18rem]:sr-only"
                        />
                      )}
                      {loja && !vendido && (
                        <a
                          href={`/loja/${loja.slug}/carros/${c.id}`}
                          target="_blank"
                          rel="noopener"
                          className={buttonVariants({ variant: "ghost", size: "sm", className: "ml-auto" })}
                        >
                          <ExternalLink aria-hidden /> <span className="@max-sm:sr-only">Ver na vitrine</span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
