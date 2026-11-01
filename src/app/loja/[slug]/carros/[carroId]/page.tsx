import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Calculator, MessageCircle } from "lucide-react";
import { z } from "zod";
import { db } from "@/lib/db";
import { carros, lojas } from "@/lib/db/schema";
import { formatMilhar, whatsappUrl } from "@/lib/masks";
import { fotoUrl } from "@/lib/r2";
import { formatBRL } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Gallery } from "@/components/gallery";

export const metadata: Metadata = { title: "Detalhes do carro" };

export default async function CarroPage({ params }: PageProps<"/loja/[slug]/carros/[carroId]">) {
  const { slug, carroId } = await params;
  if (!z.uuid().safeParse(carroId).success) notFound();

  // Join pela loja do slug garante que o carro pertence à vitrine acessada.
  const [carro] = await db
    .select({
      marca: carros.marca,
      modelo: carros.modelo,
      versao: carros.versao,
      ano: carros.ano,
      km: carros.km,
      precoCentavos: carros.precoCentavos,
      cor: carros.cor,
      cambio: carros.cambio,
      combustivel: carros.combustivel,
      descricao: carros.descricao,
      fotos: carros.fotos,
      status: carros.status,
      lojaNome: lojas.nome,
      whatsapp: lojas.whatsapp,
    })
    .from(carros)
    .innerJoin(lojas, eq(lojas.id, carros.lojaId))
    .where(and(eq(lojas.slug, slug), eq(carros.id, carroId)))
    .limit(1);
  if (!carro) notFound();

  const titulo = `${carro.marca} ${carro.modelo}`;
  const vendido = carro.status === "vendido";
  const link = `${process.env.APP_BASE_URL ?? ""}/loja/${slug}/carros/${carroId}`;
  const ficha = [
    ["Ano", String(carro.ano)],
    ["Quilometragem", `${formatMilhar(String(carro.km))}\u00a0km`],
    ["Câmbio", carro.cambio],
    ["Combustível", carro.combustivel],
    ["Cor", carro.cor],
  ].filter((f): f is [string, string] => !!f[1]);

  const acoes = (
    <>
      {carro.whatsapp && (
        <a
          href={whatsappUrl(carro.whatsapp, `Olá! Tenho interesse no ${titulo} ${carro.ano}: ${link}`)}
          target="_blank"
          rel="noopener"
          className={buttonVariants({ variant: "signal", size: "lg", className: "w-full" })}
        >
          <MessageCircle aria-hidden /> Falar no WhatsApp
        </a>
      )}
      {!vendido && (
        <Link
          href={`/loja/${slug}/carros/${carroId}/simular`}
          className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}
        >
          <Calculator aria-hidden /> Simular financiamento
        </Link>
      )}
    </>
  );

  return (
    <div className="min-h-dvh pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-16">
      <header className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 lg:px-8 lg:py-6">
        <Link
          href={`/loja/${slug}`}
          className="inline-flex h-11 items-center gap-2 rounded-full pr-4 pl-1 text-ink-2 transition-colors duration-(--dur-micro) hover:text-ink motion-reduce:transition-none"
        >
          <span className="grid size-9 place-items-center rounded-full bg-paper-2">
            <ArrowLeft className="size-5" aria-hidden />
          </span>
          <span className="truncate">{carro.lojaNome}</span>
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12 lg:px-8">
        <div className="grid min-w-0 content-start gap-8">
          <Gallery fotos={carro.fotos.map(fotoUrl)} alt={`${titulo} ${carro.ano}`} />
          {carro.descricao && (
            <section aria-labelledby="obs" className="hidden gap-3 lg:grid">
              <h2 id="obs" className="font-display text-xl font-light">
                Observações da loja
              </h2>
              <p className="max-w-[65ch] whitespace-pre-line text-ink-2">{carro.descricao}</p>
            </section>
          )}
        </div>

        <aside className="grid min-w-0 content-start gap-6 px-4 lg:sticky lg:top-8 lg:self-start lg:px-0">
          <div className="grid gap-2">
            {vendido && <StatusBadge status="vendido" className="justify-self-start" />}
            <h1 className="font-display text-3xl leading-tight font-light lg:text-[2.5rem]">{titulo}</h1>
            {carro.versao && <p className="text-ink-3">{carro.versao}</p>}
          </div>
          <p className="grid">
            <span className="text-sm text-ink-3">{vendido ? "Último preço" : "Preço"}</span>
            <span className={vendido ? "num font-display text-4xl font-extralight text-ink-3 line-through" : "num font-display text-4xl font-extralight"}>
              {formatBRL(carro.precoCentavos)}
            </span>
          </p>

          <div className="hidden gap-2 lg:grid">{acoes}</div>

          <dl className="grid grid-cols-2 border-t border-rule">
            {ficha.map(([rotulo, valor], i) => (
              <div key={rotulo} className={i % 2 ? "border-b border-l border-rule py-4 pl-4" : "border-b border-rule py-4 pr-4"}>
                <dt className="text-sm text-ink-3">{rotulo}</dt>
                <dd className="num text-lg">{valor}</dd>
              </div>
            ))}
          </dl>

          {carro.descricao && (
            <section aria-labelledby="obs-m" className="grid gap-3 lg:hidden">
              <h2 id="obs-m" className="font-display text-xl font-light">
                Observações da loja
              </h2>
              <p className="whitespace-pre-line text-ink-2">{carro.descricao}</p>
            </section>
          )}
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-(--z-sticky-nav) border-t border-rule bg-paper px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-2">{acoes}</div>
      </div>
    </div>
  );
}
