import { Suspense } from "react";
import { BottomNav, Nav } from "@/components/bottom-nav";

// Layout só monta a navegação. A autorização fica em cada página (requireLojaId),
// porque layouts não re-executam em navegações client-side.
export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>{children}</Suspense>
      </main>
      <Suspense fallback={<Nav />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
