import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { lojas } from "@/lib/db/schema";
import { requireLojaId } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { LojaForm } from "@/components/loja-form";
import { salvarLoja } from "../actions";

export const metadata: Metadata = { title: "Minha Loja" };

export default async function MinhaLojaPage() {
  const lojaId = await requireLojaId("/painel/loja");
  const [loja] = await db
    .select({ nome: lojas.nome, slug: lojas.slug, whatsapp: lojas.whatsapp })
    .from(lojas)
    .where(eq(lojas.id, lojaId))
    .limit(1);

  return (
    <div className="grid grid-cols-1 gap-8">
      <h1 className="text-display-md">Minha Loja</h1>
      <LojaForm action={salvarLoja} inicial={loja} submitLabel="Salvar" />

      <section className="grid grid-cols-1 gap-3 rounded-md bg-card p-4">
        <h2 className="font-semibold">Link da vitrine</h2>
        <p className="truncate text-body-md text-muted-foreground">/loja/{loja?.slug}</p>
        <div className="flex gap-2">
          <CopyLinkButton path={`/loja/${loja?.slug}`} className="flex-1" />
          <a href={`/loja/${loja?.slug}`} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline", className: "flex-1" })}>
            <ExternalLink aria-hidden /> Abrir
          </a>
        </div>
      </section>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button type="submit" variant="ghost" className="w-full text-muted-foreground">
          Sair da conta
        </Button>
      </form>
    </div>
  );
}
