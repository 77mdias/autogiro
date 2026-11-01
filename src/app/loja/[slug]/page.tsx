import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { Car, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { carros, lojas } from "@/lib/db/schema";
import { whatsappUrl } from "@/lib/masks";
import { fotoUrl } from "@/lib/r2";
import { cn, formatBRL } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Vitrine" };

// Vitrine pública: seleciona só colunas públicas, nunca `select *`.
export default async function VitrinePage({ params }: PageProps<"/loja/[slug]">) {
  const { slug } = await params;
  const [loja] = await db
    .select({ id: lojas.id, nome: lojas.nome, cidade: lojas.cidade, whatsapp: lojas.whatsapp })
    .from(lojas)
    .where(eq(lojas.slug, slug))
    .limit(1);
  if (!loja) notFound();

  const estoque = await db
    .select({
      id: carros.id,
      marca: carros.marca,
      modelo: carros.modelo,
      ano: carros.ano,
      km: carros.km,
      precoCentavos: carros.precoCentavos,
      fotos: carros.fotos,
      status: carros.status,
    })
    .from(carros)
    .where(eq(carros.lojaId, loja.id))
    .orderBy(asc(carros.status), desc(carros.createdAt));

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-sub-lg">{loja.nome}</h1>
            {loja.cidade && <p className="text-body-md text-muted-foreground">{loja.cidade}</p>}
          </div>
          {loja.whatsapp && (
            <a
              href={whatsappUrl(loja.whatsapp, `Olá ${loja.nome}! Vi seus carros no Garagem Link.`)}
              target="_blank"
              rel="noopener"
              className={buttonVariants({ size: "sm" })}
            >
              <MessageCircle aria-hidden /> WhatsApp
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {estoque.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Nenhum carro anunciado no momento.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {estoque.map((c) => {
              const vendido = c.status === "vendido";
              return (
                <li key={c.id}>
                  <Link href={`/loja/${slug}/carros/${c.id}`} className="block overflow-hidden rounded-md bg-card">
                    <div className="relative">
                      {c.fotos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2
                        <img
                          src={fotoUrl(c.fotos[0])}
                          alt={`${c.marca} ${c.modelo}`}
                          loading="lazy"
                          className={cn("aspect-[4/3] w-full object-cover", vendido && "grayscale")}
                        />
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
                          <Car className="size-10 text-muted-foreground" aria-hidden />
                        </div>
                      )}
                      {vendido && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                          <span className="rounded-full bg-foreground px-4 py-1.5 text-body-md font-bold tracking-wide text-background uppercase">
                            Vendido
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={cn("grid grid-cols-1 gap-1 p-4", vendido && "text-muted-foreground")}>
                      <p className="text-sub-md">
                        {c.marca} {c.modelo}
                      </p>
                      <p className="text-body-md text-muted-foreground">
                        {c.ano} · {c.km.toLocaleString("pt-BR")} km
                      </p>
                      <p className={cn("text-sub-lg", vendido && "line-through")}>{formatBRL(c.precoCentavos)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
