import { Suspense } from "react";
import { BottomNav, Nav } from "@/components/bottom-nav";

// Layout só monta a navegação. A autorização fica em cada página (requireLojaId),
// porque layouts não re-executam em navegações client-side.
export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<Nav />}>
        <BottomNav />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-8 lg:pt-10 lg:pb-16">
        <Suspense fallback={<p className="text-ink-3">Carregando…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
