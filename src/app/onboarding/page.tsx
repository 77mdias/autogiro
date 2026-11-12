import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LojaForm } from "@/components/loja-form";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { criarLoja } from "@/app/painel/actions";
import { TRIAL_DIAS } from "@/lib/plano";
import { ExcluirConta } from "@/app/painel/loja/excluir-conta";

export const metadata: Metadata = { title: "Criar sua loja" };

async function Onboarding() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/onboarding");
  if (session.user.loja_id) redirect("/painel/estoque");
  return (
    <>
      <LojaForm action={criarLoja} submitLabel="Criar minha loja" />
      <ExcluirConta papel={null} />
    </>
  );
}

export default function OnboardingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex h-16 w-full max-w-(--container) items-center justify-between px-4 lg:h-20 lg:px-(--gutter)">
          <Link href="/" aria-label="AutoGiro, página inicial" className="rounded-card">
            <Wordmark />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10 lg:py-16">
        <div className="ticks grid content-start gap-8 bg-paper-2 p-6 sm:p-10">
          <div className="grid grid-cols-1 gap-2 border-b border-rule pb-6">
            <h1 className="font-display text-3xl font-semibold">Vamos criar sua loja</h1>
            <p className="text-ink-2">{TRIAL_DIAS} dias grátis, sem cartão (um teste por WhatsApp). O link da vitrine sai na hora.</p>
            <p className="text-sm text-ink-3">Vai trabalhar na loja de outra pessoa? Não crie uma loja: abra o link de convite que o gestor mandou.</p>
            <p className="text-sm text-ink-3">
              Ao criar a loja, você concorda com os{" "}
              <Link href="/termos" className="rounded-card underline underline-offset-4">
                termos de uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="rounded-card underline underline-offset-4">
                política de privacidade
              </Link>
              .
            </p>
          </div>
          <Suspense>
            <Onboarding />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
