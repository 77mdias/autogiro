import { Suspense } from "react";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lojas, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { getLojaId } from "@/lib/session";
import { Nav, NavAtual } from "@/components/painel-nav";

// Layout só monta a navegação. A autorização fica em cada página (requireLojaId),
// porque layouts não re-executam em navegações client-side; as actions chamam
// revalidatePath("/painel", "layout"), o que atualiza o contador de novas.
export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <div className="min-h-dvh bg-paper text-ink lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Suspense fallback={<Nav />}>
        <NavDaLoja />
      </Suspense>
      <main className="mx-auto w-full max-w-(--container) px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-(--gutter) lg:pt-10 lg:pb-16">
        <Suspense fallback={<p className="text-ink-3">Carregando…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}

async function NavDaLoja() {
  const lojaId = await getLojaId();
  if (!lojaId) return <NavAtual />;
  const [[loja], [{ novas }]] = await Promise.all([
    db.select({ nome: lojas.nome, slug: lojas.slug }).from(lojas).where(eq(lojas.id, lojaId)).limit(1),
    db.select({ novas: count() }).from(sim).where(and(eq(sim.lojaId, lojaId), eq(sim.status, "novo"))),
  ]);
  return <NavAtual loja={loja} novas={novas} />;
}
