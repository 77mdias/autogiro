import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { whatsappUrl } from "@/lib/masks";

/** Quem responde pelo AutoGiro: aparece na política de privacidade e nos termos de uso. */
export const RESPONSAVEL = "William Henrique Moreira Dias, MEI, CNPJ 61.750.284/0001-28";

/** Moldura das páginas de texto legal (/privacidade, /termos). Texto técnico: precisa de revisão jurídica. */
export function PaginaLegal({ titulo, atualizada, children }: { titulo: string; atualizada: string; children: React.ReactNode }) {
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
      <main className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-8 px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-2 border-b border-rule pb-6">
          <h1 className="font-display text-3xl font-semibold">{titulo}</h1>
          <p className="text-sm text-ink-3">Atualizada em {atualizada}.</p>
        </div>
        {children}
      </main>
    </div>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-3">
      <h2 className="font-display text-xl font-semibold">{titulo}</h2>
      <div className="grid grid-cols-1 gap-3 text-ink-2">{children}</div>
    </section>
  );
}

/** Link para o WhatsApp da AutoGiro (AUTOGIRO_WHATSAPP); sem a variável, só o texto. */
export function ContatoAutoGiro({ mensagem }: { mensagem: string }) {
  const whatsapp = process.env.AUTOGIRO_WHATSAPP;
  if (!whatsapp) return <>WhatsApp da AutoGiro</>;
  return (
    <a href={whatsappUrl(whatsapp, mensagem)} target="_blank" rel="noopener" className="text-brand underline underline-offset-4">
      WhatsApp da AutoGiro
    </a>
  );
}
