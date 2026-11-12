import type { Metadata } from "next";
import { and, count, eq } from "drizzle-orm";
import { Eye, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { carros, lojas, membros, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { getSession, requireLojaId } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { CopyLinkButton, ShareLinkButton } from "@/components/copy-link-button";
import { LojaForm } from "@/components/loja-form";
import { faixaPlano, planoLiberado, type PlanoLoja } from "@/lib/plano";
import { formatBRL } from "@/lib/utils";
import { whatsappUrl } from "@/lib/masks";
import { AssinarForm } from "./assinar-form";
import { salvarLoja } from "../actions";

export const metadata: Metadata = { title: "Minha loja" };

const dataCurta = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

// Fase de venda assistida: sem ASAAS_CHECKOUT=on, assinar é falar com a AutoGiro (link de pagamento + liberação manual).
const autoatendimento = () => process.env.ASAAS_CHECKOUT === "on";

type Mensalidade = { faixa: ReturnType<typeof faixaPlano>; assinaturaCentavos: number | null; criadaEm: Date };

/** O que dizer sobre o plano e qual botão mostrar, conforme o estado que o webhook do Asaas mantém. */
function situacao(plano: PlanoLoja, voltouDoCheckout: boolean, { faixa, assinaturaCentavos, criadaEm }: Mensalidade) {
  const faixaCentavos = faixa.reais * 100;
  const preco = `${formatBRL(faixaCentavos)} por mês (${faixa.rotulo.toLowerCase()})`;
  const liberado = planoLiberado(plano);
  // Assinatura com o valor antigo: a loja muda de faixa na próxima cobrança (aviso às lojas do plano de R$ 149).
  const mudanca =
    plano.asaasSubscriptionId && assinaturaCentavos != null && assinaturaCentavos !== faixaCentavos
      ? ` A partir da próxima cobrança, passa de ${formatBRL(assinaturaCentavos)} para ${formatBRL(faixaCentavos)} (${faixa.rotulo.toLowerCase()}).`
      : "";
  if (plano.planoStatus === "ativo") return { titulo: "Plano ativo", texto: `${formatBRL(assinaturaCentavos ?? faixaCentavos)} por mês.${mudanca}` };
  if (plano.planoStatus === "inadimplente")
    return { titulo: "Pagamento em atraso", texto: "Painel e vitrine pausados até o pagamento da fatura.", botao: "Pagar fatura" };
  if (plano.asaasSubscriptionId && liberado)
    return { titulo: "Assinatura feita", texto: `A primeira cobrança de ${formatBRL(faixaCentavos)} sai em ${dataCurta(plano.trialAte)}.` };
  if (voltouDoCheckout) return { titulo: "Assinatura recebida", texto: "A confirmação do Asaas chega em instantes. Recarregue a página em um minuto." };
  if (plano.planoStatus === "cancelado")
    return { titulo: "Assinatura cancelada", texto: `Painel e vitrine pausados. Assine de novo para voltar: ${preco}.`, botao: "Assinar com cartão" };
  // Loja que nasceu com o teste já vencido: o WhatsApp dela já teve teste grátis em outra loja (criarLoja).
  if (!liberado && plano.trialAte <= criadaEm)
    return {
      titulo: "Este WhatsApp já usou o teste grátis",
      texto: `O teste grátis é um por WhatsApp. Assine para usar o painel e a vitrine: ${preco}.`,
      botao: "Assinar com cartão",
    };
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
  // Vendedor vê a situação e o link, mas dados e assinatura ficam com o gestor (as actions também checam).
  const gestor = (await getSession())?.user.papel === "gestor";
  const [[loja], porStatus, [{ leads }], [{ vendedores }]] = await Promise.all([
    db
      .select({
        nome: lojas.nome,
        whatsapp: lojas.whatsapp,
        slug: lojas.slug,
        planoStatus: lojas.planoStatus,
        trialAte: lojas.trialAte,
        asaasSubscriptionId: lojas.asaasSubscriptionId,
        mensalidadeCentavos: lojas.mensalidadeCentavos,
        createdAt: lojas.createdAt,
      })
      .from(lojas)
      .where(eq(lojas.id, lojaId))
      .limit(1),
    db.select({ status: carros.status, n: count() }).from(carros).where(eq(carros.lojaId, lojaId)).groupBy(carros.status),
    db.select({ leads: count() }).from(sim).where(eq(sim.lojaId, lojaId)),
    db
      .select({ vendedores: count() })
      .from(membros)
      .where(and(eq(membros.lojaId, lojaId), eq(membros.papel, "vendedor"), eq(membros.ativo, true))),
  ]);
  const disponiveis = porStatus.find((r) => r.status === "disponivel")?.n ?? 0;
  const vendidos = porStatus.find((r) => r.status === "vendido")?.n ?? 0;
  const vitrine = `/loja/${loja?.slug}`;
  const host = (process.env.APP_BASE_URL ?? "").replace(/^https?:\/\//, "");
  const plano = loja && situacao(loja, assinatura === "ok", { faixa: faixaPlano(vendedores), assinaturaCentavos: loja.mensalidadeCentavos, criadaEm: loja.createdAt });
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
            {!gestor && pausado && <p className="text-ink-2">Fale com o gestor da loja para regularizar.</p>}
            {gestor &&
              plano.botao &&
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
        {gestor ? (
          <LojaForm action={salvarLoja} inicial={loja} submitLabel="Salvar alterações" />
        ) : (
          <p className="text-ink-2">Só o gestor altera os dados da loja.</p>
        )}
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
