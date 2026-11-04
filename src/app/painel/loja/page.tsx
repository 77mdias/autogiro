import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { Eye, LogOut, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { carros, lojas, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { requireLojaId } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { CopyLinkButton, ShareLinkButton } from "@/components/copy-link-button";
import { LojaForm } from "@/components/loja-form";
import { PLANO_VALOR_REAIS, planoLiberado, type PlanoLoja } from "@/lib/plano";
import { formatBRL } from "@/lib/utils";
import { whatsappUrl } from "@/lib/masks";
import { AssinarForm } from "./assinar-form";
import { salvarLoja } from "../actions";

export const metadata: Metadata = { title: "Minha loja" };

const dataCurta = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

// Fase de venda assistida: sem ASAAS_CHECKOUT=on, assinar é falar com a AutoGiro (link de pagamento + liberação manual).
const autoatendimento = () => process.env.ASAAS_CHECKOUT === "on";

/** O que dizer sobre o plano e qual botão mostrar, conforme o estado que o webhook do Asaas mantém. */
function situacao(plano: PlanoLoja, voltouDoCheckout: boolean) {
  const preco = `${formatBRL(PLANO_VALOR_REAIS * 100)} por mês`;
  const liberado = planoLiberado(plano);
  if (plano.planoStatus === "ativo") return { titulo: "Plano ativo", texto: `${preco}.` };
  if (plano.planoStatus === "inadimplente")
    return { titulo: "Pagamento em atraso", texto: "Painel e vitrine pausados até o pagamento da fatura.", botao: "Pagar fatura" };
  if (plano.asaasSubscriptionId && liberado)
    return { titulo: "Assinatura feita", texto: `A primeira cobrança de ${formatBRL(PLANO_VALOR_REAIS * 100)} sai em ${dataCurta(plano.trialAte)}.` };
  if (voltouDoCheckout) return { titulo: "Assinatura recebida", texto: "A confirmação do Asaas chega em instantes. Recarregue a página em um minuto." };
  if (plano.planoStatus === "cancelado")
    return { titulo: "Assinatura cancelada", texto: `Painel e vitrine pausados. Assine de novo para voltar: ${preco}.`, botao: "Assinar com cartão" };
  if (!liberado)
    return { titulo: "Teste grátis encerrado", texto: `Painel e vitrine pausados. Assine para voltar: ${preco}.`, botao: "Assinar com cartão" };
  return {
    titulo: `Teste grátis até ${dataCurta(plano.trialAte)}`,
    texto: autoatendimento()
      ? `Depois, ${preco} no cartão. Assinando agora, a primeira cobrança só sai no fim do teste.`
      : `Depois, ${preco} no Pix, boleto ou cartão.`,
    botao: "Assinar com cartão",
  };
}

export default async function MinhaLojaPage({ searchParams }: PageProps<"/painel/loja">) {
  const lojaId = await requireLojaId("/painel/loja", { exigePlano: false });
  const { assinatura } = await searchParams;
  const [[loja], porStatus, [{ leads }]] = await Promise.all([
    db
      .select({
        nome: lojas.nome,
        whatsapp: lojas.whatsapp,
        slug: lojas.slug,
        planoStatus: lojas.planoStatus,
        trialAte: lojas.trialAte,
        asaasSubscriptionId: lojas.asaasSubscriptionId,
      })
      .from(lojas)
      .where(eq(lojas.id, lojaId))
      .limit(1),
    db.select({ status: carros.status, n: count() }).from(carros).where(eq(carros.lojaId, lojaId)).groupBy(carros.status),
    db.select({ leads: count() }).from(sim).where(eq(sim.lojaId, lojaId)),
  ]);
  const disponiveis = porStatus.find((r) => r.status === "disponivel")?.n ?? 0;
  const vendidos = porStatus.find((r) => r.status === "vendido")?.n ?? 0;
  const vitrine = `/loja/${loja?.slug}`;
  const host = (process.env.APP_BASE_URL ?? "").replace(/^https?:\/\//, "");
  const plano = loja && situacao(loja, assinatura === "ok");
  const pausado = !!loja && !planoLiberado(loja);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <header className="grid gap-1 lg:col-span-2">
        <h1 className="font-display text-3xl font-semibold lg:text-[2.5rem]">Minha loja</h1>
        <p className="text-ink-3">Os dados que o cliente vê na sua vitrine.</p>
      </header>

      <div className="grid min-w-0 grid-cols-1 content-start gap-8">
        {plano && (
          <section aria-labelledby="plano-titulo" className="grid grid-cols-1 gap-3 border-b border-rule pb-8">
            <h2 id="plano-titulo" className="font-display text-xl font-semibold">
              {plano.titulo}
            </h2>
            <p role={pausado ? "alert" : undefined} className="max-w-[52ch] text-ink-2">
              {plano.texto}
            </p>
            {plano.botao &&
              (autoatendimento() ? (
                <AssinarForm rotulo={plano.botao} destaque={pausado} />
              ) : (
                <FalarComVendas loja={loja?.nome ?? ""} destaque={pausado} />
              ))}
          </section>
        )}
        <section aria-labelledby="link-titulo" className="ticks grid grid-cols-1 gap-4 p-5 lg:p-6">
          <h2 id="link-titulo" className="font-display text-xl font-semibold">
            Link da vitrine
          </h2>
          <p className="num truncate rounded-card bg-paper-2 px-4 py-3 text-ink-2">
            {host}
            {vitrine}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ShareLinkButton path={vitrine} title={loja?.nome ?? "Vitrine"} variant={pausado ? "outline" : "default"} />
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
              <dd className="num font-display text-3xl font-semibold">{s.valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section aria-labelledby="dados-titulo" className="grid min-w-0 grid-cols-1 content-start gap-5">
        <h2 id="dados-titulo" className="font-display text-xl font-semibold">
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

function FalarComVendas({ loja, destaque }: { loja: string; destaque: boolean }) {
  const numero = process.env.AUTOGIRO_WHATSAPP;
  if (!numero) return <p className="text-ink-2">Para assinar, fale com a equipe AutoGiro.</p>;
  return (
    <a
      href={whatsappUrl(numero, `Olá! Quero assinar o AutoGiro para a loja ${loja}.`)}
      target="_blank"
      rel="noopener"
      className={buttonVariants({ variant: destaque ? "default" : "outline", className: "w-full sm:w-auto sm:justify-self-start" })}
    >
      <MessageCircle aria-hidden /> Falar com a AutoGiro
    </a>
  );
}
