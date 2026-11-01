import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { z } from "zod";
import { db } from "@/lib/db";
import { carros, lojas } from "@/lib/db/schema";
import { whatsappUrl } from "@/lib/masks";
import { fotoUrl } from "@/lib/r2";
import { formatBRL } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Detalhes do carro" };

export default async function CarroPage({ params }: PageProps<"/loja/[slug]/carros/[carroId]">) {
  const { slug, carroId } = await params;
  if (!z.uuid().safeParse(carroId).success) notFound();

  // Join pela loja do slug garante que o carro pertence à vitrine acessada.
  const [carro] = await db
    .select({
      marca: carros.marca,
      modelo: carros.modelo,
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
    ["KM", carro.km.toLocaleString("pt-BR")],
    ["Câmbio", carro.cambio],
    ["Combustível", carro.combustivel],
    ["Cor", carro.cor],
  ].filter((f): f is [string, string] => !!f[1]);

  return (
    <>
      <main className="mx-auto w-full max-w-3xl pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <div className="relative">
          <Link
            href={`/loja/${slug}`}
            aria-label={`Voltar para ${carro.lojaNome}`}
            className="absolute top-3 left-3 z-10 flex size-11 items-center justify-center rounded-full bg-background/90"
          >
            <ChevronLeft className="size-6" aria-hidden />
          </Link>
          {carro.fotos.length > 0 ? (
            <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]" aria-label="Galeria de fotos">
              {carro.fotos.map((key, i) => (
                <div key={key} className="relative w-full shrink-0 snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2 */}
                  <img src={fotoUrl(key)} alt={`${titulo} — foto ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                  <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-0.5 text-caption font-medium text-white">
                    {i + 1}/{carro.fotos.length}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[4/3] w-full bg-muted" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 px-4 pt-5">
          <div className="grid grid-cols-1 gap-1">
            {vendido && <StatusBadge status="vendido" className="mb-1 w-fit" />}
            <h1 className="text-display-md">{titulo}</h1>
            <p className="text-display-md">{formatBRL(carro.precoCentavos)}</p>
          </div>

          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ficha.map(([k, v]) => (
              <div key={k} className="rounded-md bg-card p-4">
                <dt className="text-caption text-muted-foreground uppercase">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {carro.descricao && (
            <section className="grid grid-cols-1 gap-2">
              <h2 className="font-semibold">Observações</h2>
              <p className="whitespace-pre-line text-muted-foreground">{carro.descricao}</p>
            </section>
          )}
          <p className="text-body-md text-muted-foreground">Anunciado por {carro.lojaNome}</p>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-3xl auto-cols-fr grid-flow-col gap-2 px-4 py-3">
          {carro.whatsapp && (
            <a
              href={whatsappUrl(carro.whatsapp, `Olá! Tenho interesse no ${titulo} ${carro.ano}: ${link}`)}
              target="_blank"
              rel="noopener"
              className={buttonVariants({ size: "lg", className: "px-3 text-[15px] whitespace-normal" })}
            >
              <MessageCircle aria-hidden /> Falar no WhatsApp
            </a>
          )}
          {!vendido && (
            <Link href={`/loja/${slug}/carros/${carroId}/simular`} className={buttonVariants({ size: "lg", variant: "outline", className: "px-3 text-center text-[15px] leading-tight whitespace-normal" })}>
              Simular financiamento
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
