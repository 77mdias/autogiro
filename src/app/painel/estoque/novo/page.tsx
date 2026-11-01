import type { Metadata } from "next";
import { requireLojaId } from "@/lib/session";
import { BackHeader } from "@/components/back-header";
import { CarroForm } from "../carro-form";

export const metadata: Metadata = { title: "Cadastrar carro" };

export default async function NovoCarroPage() {
  await requireLojaId("/painel/estoque/novo");
  return (
    <>
      <BackHeader href="/painel/estoque" title="Cadastrar carro" />
      <CarroForm />
    </>
  );
}
