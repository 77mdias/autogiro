import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ContaShell } from "@/components/conta-shell";
import { RedefinirForm } from "@/components/conta-forms";

export const metadata: Metadata = { title: "Senha nova" };

// O token só é conferido (e gasto) ao salvar: abrir o link não muda nada.
async function Formulario({ searchParams }: { searchParams: PageProps<"/redefinir-senha">["searchParams"] }) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) {
    return (
      <Link href="/esqueci-senha" className="justify-self-start rounded-card text-brand underline underline-offset-4">
        Pedir um link novo
      </Link>
    );
  }
  return <RedefinirForm token={token} />;
}

export default function RedefinirSenhaPage(props: PageProps<"/redefinir-senha">) {
  return (
    <ContaShell titulo="Crie uma senha nova" texto="Pelo menos 8 caracteres. Depois de salvar, entre com ela.">
      <Suspense>
        <Formulario searchParams={props.searchParams} />
      </Suspense>
    </ContaShell>
  );
}
