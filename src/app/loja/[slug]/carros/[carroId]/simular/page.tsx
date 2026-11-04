import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { carros, lojas } from "@/lib/db/schema";
import { fotoUrl } from "@/lib/r2";
import { formatBRL } from "@/lib/utils";
import { BackHeader } from "@/components/back-header";
import { SimulacaoForm } from "./simulacao-form";

export const metadata: Metadata = { title: "Simular financiamento" };

export default async function SimularPage({ params }: PageProps<"/loja/[slug]/carros/[carroId]/simular">) {
  const { slug, carroId } = await params;
  if (!z.uuid().safeParse(carroId).success) notFound();

  const [carro] = await db
    .select({ marca: carros.marca, modelo: carros.modelo, ano: carros.ano, precoCentavos: carros.precoCentavos, fotos: carros.fotos, lojaNome: lojas.nome })
    .from(carros)
    .innerJoin(lojas, eq(lojas.id, carros.lojaId))
    .where(and(eq(lojas.slug, slug), eq(carros.id, carroId), ne(carros.status, "vendido")))
    .limit(1);
  if (!carro) notFound();

  return (
    <main className="mx-auto w-full px-4 py-4 lg:px-8 lg:py-10">
      <BackHeader href={`/loja/${slug}/carros/${carroId}`} title="Simular financiamento" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <aside className="grid min-w-0 content-start gap-4 lg:sticky lg:top-8 lg:self-start">
          <div className="flex items-center gap-4 border-b border-rule pb-5 lg:grid">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-card lg:aspect-[4/3] lg:size-auto lg:w-full">
              {carro.fotos[0] && (
                // eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2
                <img src={fotoUrl(carro.fotos[0])} alt="" className="absolute inset-0 size-full object-cover" />
              )}
            </div>
            <p className="grid min-w-0">
              <span className="truncate text-lg font-medium">
                {carro.marca} {carro.modelo} {carro.ano}
              </span>
              <span className="num font-display text-2xl font-semibold">{formatBRL(carro.precoCentavos)}</span>
              <span className="text-sm text-ink-3">{carro.lojaNome}</span>
            </p>
          </div>
          <p className="hidden max-w-[44ch] text-sm text-ink-3 lg:block">
            A loja recebe seu pedido com a CNH e responde pelo WhatsApp. A CNH só é vista pela loja, por um link que vale 5 minutos.
          </p>
        </aside>
        <SimulacaoForm carroId={carroId} precoReais={Math.round(carro.precoCentavos / 100)} lojaNome={carro.lojaNome} />
      </div>
    </main>
  );
}
