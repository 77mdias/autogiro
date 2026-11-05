import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { carros, pedidosEdicao } from "@/lib/db/schema";
import { fotoUrl } from "@/lib/r2";
import { requireMembro } from "@/lib/session";
import { BackHeader } from "@/components/back-header";
import { CarroForm } from "../carro-form";
import { ExcluirCarro } from "./excluir-carro";

export const metadata: Metadata = { title: "Editar carro" };

export default async function EditarCarroPage({ params }: PageProps<"/painel/estoque/[id]">) {
  const { id } = await params;
  const { lojaId, papel } = await requireMembro(`/painel/estoque/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const vendedor = papel !== "gestor";

  const [[carro], [pendente]] = await Promise.all([
    db
      .select()
      .from(carros)
      .where(and(eq(carros.id, id), eq(carros.lojaId, lojaId)))
      .limit(1),
    db
      .select({ id: pedidosEdicao.id })
      .from(pedidosEdicao)
      .where(and(eq(pedidosEdicao.carroId, id), eq(pedidosEdicao.lojaId, lojaId), eq(pedidosEdicao.status, "pendente")))
      .limit(1),
  ]);
  if (!carro) notFound();

  return (
    <>
      <BackHeader href="/painel/estoque" title="Editar carro" />
      {(pendente || vendedor) && (
        <p role="status" className="ticks mb-6 p-4 text-ink-2 lg:mb-10">
          {pendente ? (
            <>
              Este carro tem um pedido esperando o gestor.{" "}
              <Link href="/painel/pedidos" className="text-ink underline underline-offset-4">
                Ver pedidos
              </Link>
            </>
          ) : (
            "O que você mudar aqui vai para o gestor aprovar. O carro só muda depois disso."
          )}
        </p>
      )}
      <CarroForm carro={{ ...carro, fotos: carro.fotos.map((key) => ({ key, url: fotoUrl(key) })) }} paraAprovacao={vendedor} />
      <ExcluirCarro id={carro.id} nome={`${carro.marca} ${carro.modelo}`} paraAprovacao={vendedor} />
    </>
  );
}
