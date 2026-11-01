import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { Car, Images, MapPin, MessageCircle, Search } from "lucide-react";
import { db } from "@/lib/db";
import { carros, lojas } from "@/lib/db/schema";
import { whatsappUrl } from "@/lib/masks";
import { fotoUrl } from "@/lib/r2";
import { cn, formatBRL } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CarSpecs } from "@/components/car-specs";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = { title: "Vitrine" };

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "disponivel", rotulo: "Disponíveis" },
  { valor: "vendido", rotulo: "Vendidos" },
] as const;
type Filtro = (typeof FILTROS)[number]["valor"];

// Vitrine pública: seleciona só colunas públicas, nunca `select *`.
export default async function VitrinePage({ params, searchParams }: PageProps<"/loja/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const status: Filtro = sp.status === "disponivel" || sp.status === "vendido" ? sp.status : "todos";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";

  const [loja] = await db
    .select({ id: lojas.id, nome: lojas.nome, cidade: lojas.cidade, whatsapp: lojas.whatsapp })
    .from(lojas)
    .where(eq(lojas.slug, slug))
    .limit(1);
  if (!loja) notFound();

  const onde: SQL[] = [eq(carros.lojaId, loja.id)];
  if (status !== "todos") onde.push(eq(carros.status, status));
  if (q) {
    const termo = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    onde.push(ilike(sql`concat_ws(' ', ${carros.marca}, ${carros.modelo}, ${carros.versao}, ${carros.ano})`, termo));
  }

  const estoque = await db
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
      fotos: carros.fotos,
      status: carros.status,
    })
    .from(carros)
    .where(and(...onde))
    .orderBy(asc(carros.status), desc(carros.createdAt));

  const filtroHref = (f: Filtro) => {
    const p = new URLSearchParams();
    if (f !== "todos") p.set("status", f);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/loja/${slug}?${s}` : `/loja/${slug}`;
  };
  const filtrando = status !== "todos" || q;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center lg:px-8 lg:py-10">
          <div className="flex min-w-0 items-center gap-4">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-full bg-navy font-display text-2xl font-light text-navy-ink lg:size-16"
              aria-hidden
            >
              {loja.nome.trim()[0]?.toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-2xl leading-tight font-light lg:text-[2.5rem]">{loja.nome}</h1>
              {loja.cidade && (
                <p className="mt-1 flex items-center gap-1.5 text-ink-3">
                  <MapPin className="size-4 shrink-0" aria-hidden /> {loja.cidade}
                </p>
              )}
            </div>
          </div>
          {loja.whatsapp && (
            <a
              href={whatsappUrl(loja.whatsapp, `Olá ${loja.nome}! Vi seus carros na vitrine.`)}
              target="_blank"
              rel="noopener"
              className={buttonVariants({ variant: "signal", size: "lg", className: "w-full sm:w-auto" })}
            >
              <MessageCircle aria-hidden /> Falar no WhatsApp da loja
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 content-start gap-6 px-4 py-6 lg:gap-8 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-center">
          <form role="search" action={`/loja/${slug}`} className="relative">
            {status !== "todos" && <input type="hidden" name="status" value={status} />}
            <label htmlFor="q" className="sr-only">
              Buscar carro
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3" aria-hidden />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Buscar por modelo, marca ou ano"
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
                      href={filtroHref(f.valor)}
                      aria-current={ativo ? "page" : undefined}
                      className={cn(
                        "inline-flex h-10 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors duration-(--dur-micro) motion-reduce:transition-none",
                        ativo ? "border-ink bg-ink text-paper" : "border-rule-2 text-ink-2 hover:border-ink",
                      )}
                    >
                      {f.rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {estoque.length === 0 ? (
          <section className="ticks grid justify-items-start gap-3 px-6 py-12">
            <Car className="size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
            <h2 className="font-display text-2xl font-light">{filtrando ? "Nenhum carro encontrado" : "Estoque sendo atualizado"}</h2>
            <p className="max-w-[48ch] text-ink-2">
              {filtrando
                ? "Tente outro modelo ou veja todo o estoque."
                : "Os carros desta loja aparecem aqui assim que forem cadastrados. Fale com a loja pelo WhatsApp."}
            </p>
            {filtrando && (
              <Link href={`/loja/${slug}`} className={buttonVariants({ variant: "outline" })}>
                Ver todo o estoque
              </Link>
            )}
          </section>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {estoque.map((c) => {
              const vendido = c.status === "vendido";
              const nome = `${c.marca} ${c.modelo}`;
              return (
                <li key={c.id}>
                  <article className="relative flex h-full flex-col overflow-hidden rounded-card border border-rule bg-paper transition-colors duration-(--dur-short) hover:border-rule-2 motion-reduce:transition-none">
                    <div className="relative aspect-[4/3] bg-paper-2">
                      {c.fotos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2
                        <img
                          src={fotoUrl(c.fotos[0])}
                          alt=""
                          loading="lazy"
                          className={cn("absolute inset-0 size-full object-cover", vendido && "opacity-60 grayscale")}
                        />
                      ) : (
                        <Car className="absolute inset-0 m-auto size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
                      )}
                      {vendido ? (
                        <span className="absolute inset-0 grid place-items-center">
                          <span className="rounded-full bg-ink px-4 py-1.5 font-display text-lg text-paper">Vendido</span>
                        </span>
                      ) : (
                        c.fotos.length > 1 && (
                          <span className="absolute right-3 bottom-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-ink/80 px-2.5 text-xs text-paper">
                            <Images className="size-3.5" aria-hidden />
                            <span className="num">{c.fotos.length}</span>
                            <span className="sr-only">fotos</span>
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h2 className={cn("text-lg leading-snug font-normal", vendido && "text-ink-3")}>
                        <Link
                          href={`/loja/${slug}/carros/${c.id}`}
                          className="outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
                        >
                          {nome}
                        </Link>
                        {c.versao && <span className="block truncate text-sm text-ink-3">{c.versao}</span>}
                      </h2>
                      <CarSpecs carro={c} />
                      <p className="mt-auto grid">
                        <span className="text-sm text-ink-3">{vendido ? "Último preço" : "Preço"}</span>
                        <span className={cn("num font-display text-2xl font-light", vendido && "text-ink-3 line-through")}>
                          {formatBRL(c.precoCentavos)}
                        </span>
                      </p>
                      {!vendido && loja.whatsapp && (
                        <a
                          href={whatsappUrl(loja.whatsapp, `Olá! Tenho interesse no ${nome} ${c.ano} que vi na vitrine.`)}
                          target="_blank"
                          rel="noopener"
                          className={buttonVariants({ variant: "outline", className: "relative z-(--z-raised) w-full border-signal text-signal hover:bg-paper-2" })}
                        >
                          <MessageCircle aria-hidden /> Chamar no WhatsApp
                        </a>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-6 text-sm text-ink-3 lg:px-8">
          <span>Vitrine feita com</span>
          <Link href="/" aria-label="AutoGiro, conhecer o app" className="rounded-card">
            <Wordmark className="text-md" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
