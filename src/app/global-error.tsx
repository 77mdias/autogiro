"use client";

import { ErroTela } from "@/components/erro-tela";
import "./globals.css";

// Erro no próprio layout raiz: substitui o html inteiro, então só dá para recarregar.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR" className="overflow-x-clip">
      <body className="overflow-x-clip bg-paper text-ink antialiased">
        <main className="mx-auto grid min-h-dvh w-full max-w-(--container) content-center">
          <ErroTela error={error} reset={reset} recarregarSempre />
        </main>
      </body>
    </html>
  );
}
