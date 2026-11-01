import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { carros, lojas } from "@/lib/db/schema";
import { formatBRL } from "@/lib/utils";
import { BackHeader } from "@/components/back-header";
import { SimulacaoForm } from "./simulacao-form";

export const metadata: Metadata = { title: "Simular financiamento" };

export default async function SimularPage({ params }: PageProps<"/loja/[slug]/carros/[carroId]/simular">) {
  const { slug, carroId } = await params;
  if (!z.uuid().safeParse(carroId).success) notFound();

  const [carro] = await db
    .select({ marca: carros.marca, modelo: carros.modelo, ano: carros.ano, precoCentavos: carros.precoCentavos, lojaNome: lojas.nome })
    .from(carros)
    .innerJoin(lojas, eq(lojas.id, carros.lojaId))
    .where(and(eq(lojas.slug, slug), eq(carros.id, carroId), ne(carros.status, "vendido")))
    .limit(1);
  if (!carro) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-4">
      <BackHeader href={`/loja/${slug}/carros/${carroId}`} title="Simular financiamento" />
      <div className="mb-6 rounded-md bg-card p-4">
        <p className="text-sub-md">
          {carro.marca} {carro.modelo} {carro.ano}
        </p>
        <p className="text-sub-lg">{formatBRL(carro.precoCentavos)}</p>
      </div>
      <SimulacaoForm carroId={carroId} precoReais={Math.round(carro.precoCentavos / 100)} lojaNome={carro.lojaNome} />
    </main>
  );
}
