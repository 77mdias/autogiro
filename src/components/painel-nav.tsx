"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Car, ClipboardCheck, ExternalLink, HandCoins, LogOut, Menu, Plus, Store, UserCog, Users, X, type LucideIcon } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { sair } from "@/app/painel/actions";
import { cn } from "@/lib/utils";

export type NavLoja = { nome: string; slug: string };
type NavProps = { pathname?: string; loja?: NavLoja; novas?: number; pedidos?: number; gestor?: boolean };

const NOVO_CARRO = "/painel/estoque/novo";

export function NavAtual(props: Omit<NavProps, "pathname">) {
  return <Nav pathname={usePathname()} {...props} />;
}

/**
 * Desktop: barra lateral fixa à esquerda. Celular: a mesma lista numa gaveta, aberta pelo
 * botão de menu no canto inferior esquerdo; no direito, cadastrar carro (alcance do polegar).
 * Sem pathname = fallback de Suspense, nenhum item ativo.
 */
export function Nav({ pathname = "", loja, novas = 0, pedidos = 0, gestor = false }: NavProps) {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule bg-paper lg:flex">
        <Conteudo pathname={pathname} loja={loja} novas={novas} pedidos={pedidos} gestor={gestor} />
      </aside>

      <header className="sticky top-0 z-(--z-sticky-nav) border-b border-rule bg-paper lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href="/painel" aria-label="AutoGiro, início do painel" className="rounded-card">
            <Wordmark />
          </Link>
          {loja && <span className="ml-auto truncate text-sm text-ink-3">{loja.nome}</span>}
        </div>
      </header>

      <Dialog.Root open={aberta} onOpenChange={setAberta}>
        <Dialog.Trigger
          aria-label={["Abrir menu", novas > 0 && `${novas} ${novas === 1 ? "simulação nova" : "simulações novas"}`, pedidos > 0 && `${pedidos} ${pedidos === 1 ? "pedido" : "pedidos"} para aprovar`].filter(Boolean).join(", ")}
          className={cn(
            fab,
            "left-4 border border-rule-2 bg-paper text-ink hover:border-ink",
          )}
        >
          <Menu className="size-6" aria-hidden />
          {novas + pedidos > 0 && <span className="absolute top-2 right-2 size-3 rounded-full border-2 border-paper bg-navy" aria-hidden />}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-(--z-modal) bg-ink/40 transition-opacity duration-(--dur-short) data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none lg:hidden" />
          <Dialog.Popup className="fixed inset-y-0 left-0 z-(--z-modal) flex w-[min(20rem,85vw)] flex-col bg-paper pb-[env(safe-area-inset-bottom)] outline-none transition-transform duration-(--dur-long) ease-(--ease-out) data-ending-style:-translate-x-full data-starting-style:-translate-x-full motion-reduce:transition-none lg:hidden">
            <Dialog.Title className="sr-only">Menu do painel</Dialog.Title>
            <Dialog.Close
              aria-label="Fechar menu"
              className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
            <Conteudo pathname={pathname} loja={loja} novas={novas} pedidos={pedidos} gestor={gestor} aoNavegar={() => setAberta(false)} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {pathname !== NOVO_CARRO && (
        <Link href={NOVO_CARRO} aria-label="Cadastrar carro" className={cn(fab, "right-4 bg-brand text-brand-ink hover:bg-brand/90")}>
          <Car className="size-6" aria-hidden />
          <Plus className="absolute top-2.5 right-2.5 size-4" strokeWidth={2.5} aria-hidden />
        </Link>
      )}
    </>
  );
}

const fab =
  "fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] z-(--z-sticky-nav) grid size-14 place-items-center rounded-full transition-[background-color,border-color,transform] duration-(--dur-micro) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px motion-reduce:transition-none lg:hidden";

function Contador({ n, rotulo }: { n: number; rotulo: string }) {
  if (n <= 0) return null;
  return (
    <span className="num ml-auto inline-grid h-6 min-w-6 place-items-center rounded-full bg-navy px-1.5 text-xs text-navy-ink">
      {n}
      <span className="sr-only"> {rotulo}</span>
    </span>
  );
}

function Conteudo({ pathname, loja, novas, pedidos, gestor, aoNavegar }: Required<Omit<NavProps, "loja">> & { loja?: NavLoja; aoNavegar?: () => void }) {
  return (
    <>
      <div className="grid gap-1 border-b border-rule px-5 pt-5 pb-4 lg:pt-6">
        <Link href="/painel" onClick={aoNavegar} aria-label="AutoGiro, início do painel" className="justify-self-start rounded-card">
          <Wordmark />
        </Link>
        {loja && <p className="mt-3 truncate font-display text-lg font-semibold">{loja.nome}</p>}
      </div>

      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto p-3">
        <ul className="grid gap-1">
          <Item href="/painel/estoque" icon={Car} ativo={pathname.startsWith("/painel/estoque")} onClick={aoNavegar}>
            Estoque
          </Item>
          <Item href="/painel/interessados" icon={Users} ativo={pathname.startsWith("/painel/interessados")} onClick={aoNavegar}>
            Interessados
            <Contador n={novas} rotulo={novas === 1 ? "nova" : "novas"} />
          </Item>
          <Item href="/painel/pedidos" icon={ClipboardCheck} ativo={pathname.startsWith("/painel/pedidos")} onClick={aoNavegar}>
            Pedidos
            <Contador n={pedidos} rotulo="para aprovar" />
          </Item>
          <Item href="/painel/vendas" icon={HandCoins} ativo={pathname.startsWith("/painel/vendas")} onClick={aoNavegar}>
            {gestor ? "Vendas e comissões" : "Minhas vendas"}
          </Item>
          {gestor && (
            <Item href="/painel/vendedores" icon={UserCog} ativo={pathname.startsWith("/painel/vendedores")} onClick={aoNavegar}>
              Vendedores
            </Item>
          )}
          {loja && (
            <li>
              <a
                href={`/loja/${loja.slug}`}
                target="_blank"
                rel="noopener"
                onClick={aoNavegar}
                className={cn(itemCls, "text-ink-2 hover:bg-paper-2 hover:text-ink")}
              >
                <ExternalLink className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                Vitrine do cliente
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
          )}
          <Item href="/painel/loja" icon={Store} ativo={pathname.startsWith("/painel/loja")} onClick={aoNavegar}>
            Minha loja
          </Item>
        </ul>
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-rule p-3">
        <form action={sair}>
          <button type="submit" className={cn(itemCls, "text-error hover:bg-paper-2")}>
            <LogOut className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
            Sair
          </button>
        </form>
        <ThemeToggle compact />
      </div>
    </>
  );
}

const itemCls =
  "relative flex h-12 w-full items-center gap-3 rounded-card px-3 text-md transition-colors duration-(--dur-micro) focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus motion-reduce:transition-none pointer-fine:h-10 pointer-fine:text-sm";

function Item({
  href,
  icon: Icon,
  ativo,
  onClick,
  children,
}: {
  href: string;
  icon: LucideIcon;
  ativo: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        aria-current={ativo ? "page" : undefined}
        className={cn(
          itemCls,
          "before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand before:opacity-0",
          ativo ? "bg-paper-2 font-medium text-ink before:opacity-100" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
        )}
      >
        <Icon className={cn("size-5 shrink-0", ativo && "text-brand")} strokeWidth={ativo ? 2 : 1.75} aria-hidden />
        {children}
      </Link>
    </li>
  );
}
