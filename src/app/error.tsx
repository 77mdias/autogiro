"use client";

import { ErroTela } from "@/components/erro-tela";

// Erros fora do painel e os do layout do painel (o error.tsx de uma pasta não pega o layout dela).
export default function RaizError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-(--container) content-center bg-paper text-ink">
      <ErroTela error={error} reset={reset} />
    </main>
  );
}
