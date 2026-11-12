import type { Metadata } from "next";
import Link from "next/link";
import { ContaShell } from "@/components/conta-shell";
import { CadastroForm } from "@/components/conta-forms";
import { TRIAL_DIAS } from "@/lib/plano";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <ContaShell titulo="Criar sua conta" texto={`Mandamos um link para o seu e-mail. Confirmado, você entra e monta a loja: ${TRIAL_DIAS} dias grátis, sem cartão.`}>
      <CadastroForm />
      <p className="text-sm text-ink-2">
        Já tem conta?{" "}
        <Link href="/login" className="rounded-card text-brand underline underline-offset-4">
          Entrar
        </Link>
      </p>
      <p className="text-sm text-ink-3">
        Ao criar a conta, você concorda com os{" "}
        <Link href="/termos" className="rounded-card underline underline-offset-4">
          termos de uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="rounded-card underline underline-offset-4">
          política de privacidade
        </Link>
        .
      </p>
    </ContaShell>
  );
}
