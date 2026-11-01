import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { Car, ChevronRight, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { carros, lojas, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { fotoUrl } from "@/lib/r2";
import { requireLojaId } from "@/lib/session";
import { formatBRL } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Estoque" };

export default async function EstoquePage() {
  const lojaId = await requireLojaId("/painel/estoque");
  const [[loja], [{ novas }], lista] = await Promise.all([
    db.select({ slug: lojas.slug }).from(lojas).where(eq(lojas.id, lojaId)).limit(1),
    db.select({ novas: count() }).from(sim).where(and(eq(sim.lojaId, lojaId), eq(sim.status, "novo"))),
    db
      .select({
        id: carros.id,
        marca: carros.marca,
        modelo: carros.modelo,
        ano: carros.ano,
        precoCentavos: carros.precoCentavos,
        status: carros.status,
        fotos: carros.fotos,
      })
      .from(carros)
      .where(eq(carros.lojaId, lojaId))
      .orderBy(asc(carros.status), desc(carros.createdAt)),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-display-md">Estoque</h1>
        {loja && <CopyLinkButton path={`/loja/${loja.slug}`} />}
      </header>

      {novas > 0 && (
        <Link href="/painel/interessados" className="flex items-center gap-3 rounded-md bg-primary p-4 text-primary-foreground">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-foreground text-body-md font-bold text-primary">
            {novas}
          </span>
          <span className="flex-1 font-medium">
            {novas === 1 ? "Nova simulação de financiamento" : "Novas simulações de financiamento"}
          </span>
          <ChevronRight aria-hidden />
        </Link>
      )}

      <Link href="/painel/estoque/novo" className={buttonVariants({ size: "lg", className: "w-full" })}>
        <Plus aria-hidden /> Cadastrar novo carro
      </Link>

      {lista.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhum carro ainda. Cadastre o primeiro e compartilhe o link da sua vitrine.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {lista.map((c) => (
            <li key={c.id}>
              <Link
                href={`/painel/estoque/${c.id}`}
                className="flex items-center gap-3 rounded-md bg-card p-3 transition-colors active:bg-muted"
              >
                {c.fotos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2
                  <img src={fotoUrl(c.fotos[0])} alt="" className="size-20 shrink-0 rounded-sm object-cover" />
                ) : (
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-sm bg-muted">
                    <Car className="size-7 text-muted-foreground" aria-hidden />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sub-md">
                    {c.marca} {c.modelo}
                  </p>
                  <p className="text-body-md text-muted-foreground">{c.ano}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-bold">{formatBRL(c.precoCentavos)}</p>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
