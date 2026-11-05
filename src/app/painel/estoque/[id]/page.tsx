import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { carros } from "@/lib/db/schema";
import { fotoUrl } from "@/lib/r2";
import { requireLojaId } from "@/lib/session";
import { BackHeader } from "@/components/back-header";
import { CarroForm } from "../carro-form";
import { ExcluirCarro } from "./excluir-carro";

export const metadata: Metadata = { title: "Editar carro" };

export default async function EditarCarroPage({ params }: PageProps<"/painel/estoque/[id]">) {
  const { id } = await params;
  const lojaId = await requireLojaId(`/painel/estoque/${id}`, { soGestor: true });
  if (!z.uuid().safeParse(id).success) notFound();

  const [carro] = await db
    .select()
    .from(carros)
    .where(and(eq(carros.id, id), eq(carros.lojaId, lojaId)))
    .limit(1);
  if (!carro) notFound();

  return (
    <>
      <BackHeader href="/painel/estoque" title="Editar carro" />
      <CarroForm carro={{ ...carro, fotos: carro.fotos.map((key) => ({ key, url: fotoUrl(key) })) }} />
      <ExcluirCarro id={carro.id} nome={`${carro.marca} ${carro.modelo}`} />
    </>
  );
}
