import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LojaForm } from "@/components/loja-form";
import { Wordmark } from "@/components/wordmark";
import { criarLoja } from "@/app/painel/actions";

export const metadata: Metadata = { title: "Criar sua loja" };

async function Onboarding() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/onboarding");
  if (session.user.loja_id) redirect("/painel/estoque");
  return <LojaForm action={criarLoja} submitLabel="Criar minha loja" />;
}

export default function OnboardingPage() {
  return (
    <main className="mx-auto grid w-full max-w-xl content-start gap-8 px-4 py-10 lg:py-20">
      <Wordmark />
      <div className="grid grid-cols-1 gap-2">
        <h1 className="font-display text-3xl font-light">Vamos criar sua loja</h1>
        <p className="text-ink-2">Só o nome e o WhatsApp. O link da vitrine sai na hora.</p>
      </div>
      <Suspense>
        <Onboarding />
      </Suspense>
    </main>
  );
}
