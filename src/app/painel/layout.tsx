import { Suspense } from "react";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lojas, pedidosEdicao, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { getMembro } from "@/lib/session";
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
  const membro = await getMembro();
  if (!membro) return <NavAtual />;
  const [[loja], [{ novas }], [{ pedidos }]] = await Promise.all([
    db.select({ nome: lojas.nome, slug: lojas.slug }).from(lojas).where(eq(lojas.id, membro.lojaId)).limit(1),
    // Só os leads novos de quem está logado: é a fila que ele tem de responder
    db
      .select({ novas: count() })
      .from(sim)
      .where(and(eq(sim.lojaId, membro.lojaId), eq(sim.responsavelId, membro.membroId), eq(sim.status, "novo"))),
    // Pedidos de edição esperando o gestor; para o vendedor não há o que decidir
    membro.papel === "gestor"
      ? db
          .select({ pedidos: count() })
          .from(pedidosEdicao)
          .where(and(eq(pedidosEdicao.lojaId, membro.lojaId), eq(pedidosEdicao.status, "pendente")))
      : [{ pedidos: 0 }],
  ]);
  return <NavAtual loja={loja} novas={novas} pedidos={pedidos} />;
}
