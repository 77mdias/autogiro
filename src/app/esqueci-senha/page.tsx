import type { Metadata } from "next";
import Link from "next/link";
import { ContaShell } from "@/components/conta-shell";
import { EsqueciForm } from "@/components/conta-forms";

export const metadata: Metadata = { title: "Esqueci a senha" };

export default function EsqueciSenhaPage() {
  return (
    <ContaShell titulo="Esqueceu a senha?" texto="Informe o e-mail da conta. Mandamos um link para criar uma senha nova.">
      <EsqueciForm />
      <Link href="/login" className="justify-self-start rounded-card text-sm text-ink-2 underline underline-offset-4 hover:text-ink">
        Voltar para entrar
      </Link>
    </ContaShell>
  );
}
