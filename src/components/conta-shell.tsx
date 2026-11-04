import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";

/** Moldura das telas de conta: login, cadastro, esqueci e redefinir a senha. */
export function ContaShell({ titulo, texto, children }: { titulo: string; texto: string; children: React.ReactNode }) {
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
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12 lg:py-16">
        <div className="ticks grid grid-cols-1 gap-8 bg-paper-2 p-6 sm:p-10">
          <div className="grid grid-cols-1 gap-2 border-b border-rule pb-6">
            <h1 className="font-display text-3xl font-semibold">{titulo}</h1>
            <p className="text-ink-2">{texto}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
