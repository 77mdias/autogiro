import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { Car } from "lucide-react";
import { db } from "@/lib/db";
import { lojas } from "@/lib/db/schema";
import { planoLiberado } from "@/lib/plano";
import Loading from "./loading";

// Plano vencido tira a vitrine do ar (vitrine, detalhe e simulação); slug inexistente segue para o 404 da página.
async function Portao({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) {
  const { slug } = await params;
  const [loja] = await db
    .select({ nome: lojas.nome, planoStatus: lojas.planoStatus, trialAte: lojas.trialAte, asaasSubscriptionId: lojas.asaasSubscriptionId })
    .from(lojas)
    .where(eq(lojas.slug, slug))
    .limit(1);
  if (!loja || planoLiberado(loja)) return children;
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-xl content-center px-4 py-10">
      <section className="ticks grid justify-items-start gap-3 px-6 py-12">
        <Car className="size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
        <h1 className="font-display text-2xl font-light">Vitrine fora do ar</h1>
        <p className="max-w-[48ch] text-ink-2">A vitrine de {loja.nome} está pausada no momento. Fale com a loja pelos canais de sempre.</p>
      </section>
    </main>
  );
}

export default function VitrineLayout({ params, children }: LayoutProps<"/loja/[slug]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Portao params={params}>{children}</Portao>
    </Suspense>
  );
}
