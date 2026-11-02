"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Store, Users } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/painel/estoque", label: "Estoque", icon: Car },
  { href: "/painel/interessados", label: "Interessados", icon: Users },
  { href: "/painel/loja", label: "Minha loja", icon: Store },
] as const;

export function BottomNav() {
  return <Nav pathname={usePathname()} />;
}

/**
 * Celular: barra de abas fixa embaixo (alcance do polegar). Desktop: as mesmas três
 * abas no topo, ao lado da marca. Sem pathname = fallback de Suspense, nenhuma ativa.
 */
export function Nav({ pathname = "" }: { pathname?: string }) {
  return (
    <>
      <header className="sticky top-0 z-(--z-sticky-nav) border-b border-rule bg-paper">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-4 lg:h-16 lg:px-8">
          <Link href="/" aria-label="AutoGiro, página inicial" className="rounded-card">
            <Wordmark />
          </Link>
          <nav aria-label="Navegação principal" className="hidden h-full lg:block">
            <ul className="flex h-full gap-1">
              {NAV.map(({ href, label }) => {
                const ativo = pathname.startsWith(href);
                return (
                  <li key={href} className="h-full">
                    <Link
                      href={href}
                      aria-current={ativo ? "page" : undefined}
                      className={cn(
                        "relative flex h-full items-center px-3 text-sm transition-colors duration-(--dur-short) motion-reduce:transition-none",
                        "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-brand after:opacity-0",
                        ativo ? "text-ink after:opacity-100" : "text-ink-3 hover:text-ink",
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-(--z-sticky-nav) border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-xl">
          {NAV.map(({ href, label, icon: Icon }) => {
            const ativo = pathname.startsWith(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors duration-(--dur-short) motion-reduce:transition-none",
                    ativo ? "text-brand" : "text-ink-3",
                  )}
                >
                  <Icon className="size-6" strokeWidth={ativo ? 2 : 1.5} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
