import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { Eye, LogOut } from "lucide-react";
import { db } from "@/lib/db";
import { carros, lojas, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { requireLojaId } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { CopyLinkButton, ShareLinkButton } from "@/components/copy-link-button";
import { LojaForm } from "@/components/loja-form";
import { salvarLoja } from "../actions";

export const metadata: Metadata = { title: "Minha loja" };

export default async function MinhaLojaPage() {
  const lojaId = await requireLojaId("/painel/loja");
  const [[loja], porStatus, [{ leads }]] = await Promise.all([
    db.select({ nome: lojas.nome, whatsapp: lojas.whatsapp, slug: lojas.slug }).from(lojas).where(eq(lojas.id, lojaId)).limit(1),
    db.select({ status: carros.status, n: count() }).from(carros).where(eq(carros.lojaId, lojaId)).groupBy(carros.status),
    db.select({ leads: count() }).from(sim).where(eq(sim.lojaId, lojaId)),
  ]);
  const disponiveis = porStatus.find((r) => r.status === "disponivel")?.n ?? 0;
  const vendidos = porStatus.find((r) => r.status === "vendido")?.n ?? 0;
  const vitrine = `/loja/${loja?.slug}`;
  const host = (process.env.APP_BASE_URL ?? "").replace(/^https?:\/\//, "");

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <header className="grid gap-1 lg:col-span-2">
        <h1 className="font-display text-3xl font-light lg:text-[2.5rem]">Minha loja</h1>
        <p className="text-ink-3">Os dados que o cliente vê na sua vitrine.</p>
      </header>

      <div className="grid min-w-0 grid-cols-1 content-start gap-8">
        <section aria-labelledby="link-titulo" className="ticks grid grid-cols-1 gap-4 p-5 lg:p-6">
          <h2 id="link-titulo" className="font-display text-xl font-light">
            Link da vitrine
          </h2>
          <p className="num truncate rounded-card bg-paper-2 px-4 py-3 text-ink-2">
            {host}
            {vitrine}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ShareLinkButton path={vitrine} title={loja?.nome ?? "Vitrine"} />
            <CopyLinkButton path={vitrine} />
            <a href={vitrine} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline" })}>
              <Eye aria-hidden /> Ver como cliente
            </a>
          </div>
        </section>

        <dl className="grid grid-cols-3 border-y border-rule">
          {[
            { rotulo: "À venda", valor: disponiveis },
            { rotulo: "Vendidos", valor: vendidos },
            { rotulo: "Simulações", valor: leads },
          ].map((s, i) => (
            <div key={s.rotulo} className={i === 0 ? "py-5 pr-4" : "border-l border-rule px-4 py-5"}>
              <dt className="text-sm text-ink-3">{s.rotulo}</dt>
              <dd className="num font-display text-3xl font-extralight">{s.valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section aria-labelledby="dados-titulo" className="grid min-w-0 grid-cols-1 content-start gap-5">
        <h2 id="dados-titulo" className="font-display text-xl font-light">
          Dados comerciais
        </h2>
        <LojaForm action={salvarLoja} inicial={loja} submitLabel="Salvar alterações" />
        <form
          className="border-t border-rule pt-5"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="ghost" className="-ml-4 text-ink-3">
            <LogOut aria-hidden /> Sair da conta
          </Button>
        </form>
      </section>
    </div>
  );
}
