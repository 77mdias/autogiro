import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LojaForm } from "@/components/loja-form";
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
    <main className="mx-auto grid w-full max-w-xl gap-6 px-4 py-10">
      <div className="grid grid-cols-1 gap-2">
        <h1 className="text-display-md">Vamos criar sua loja</h1>
        <p className="text-muted-foreground">Só o nome e o WhatsApp. Leva 30 segundos.</p>
      </div>
      <Suspense>
        <Onboarding />
      </Suspense>
    </main>
  );
}
