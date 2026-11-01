"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/painel/estoque", label: "Estoque", icon: Car },
  { href: "/painel/interessados", label: "Interessados", icon: Users },
  { href: "/painel/loja", label: "Minha Loja", icon: Store },
] as const;

export function BottomNav() {
  return <Nav pathname={usePathname()} />;
}

/** Mesmo visual sem item ativo: fallback de Suspense durante o prerender. */
export function Nav({ pathname = "" }: { pathname?: string }) {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-20 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-xl">
        {NAV.map(({ href, label, icon: Icon }) => {
          const ativo = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-caption",
                  ativo ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-6" strokeWidth={ativo ? 2.5 : 2} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
