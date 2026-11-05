import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { carros, lojas, membros, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { resumoAssinaturas, situacaoPlano, valorPlano, type Situacao } from "@/lib/plano";
import { requireAdmin } from "@/lib/session";
import { cn, formatBRL } from "@/lib/utils";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Administração", robots: { index: false, follow: false } };

const SITUACOES: { valor: Situacao; rotulo: string; nota: string }[] = [
  { valor: "teste", rotulo: "Em teste", nota: "No teste grátis, ou já assinaram e esperam a 1ª cobrança" },
  { valor: "teste_vencido", rotulo: "Teste vencido", nota: "O teste acabou sem assinatura" },
  { valor: "ativa", rotulo: "Ativas", nota: "Pagando o plano" },
  { valor: "inadimplente", rotulo: "Inadimplentes", nota: "Cobrança vencida; painel e vitrine pausados" },
  { valor: "cancelada", rotulo: "Canceladas", nota: "Assinatura cancelada" },
];
const ROTULO: Record<Situacao, string> = {
  teste: "Em teste",
  teste_vencido: "Teste vencido",
  ativa: "Ativa",
  inadimplente: "Inadimplente",
  cancelada: "Cancelada",
};

const data = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const DIAS_RECENTES = 30;

// Única tela que lê todas as lojas: só agregados e dados da loja, nunca dados de quem simulou (LGPD).
async function Painel() {
  await requireAdmin();
  const agora = new Date();
  const desde = new Date(agora.getTime() - DIAS_RECENTES * 24 * 60 * 60 * 1000).toISOString();

  // shortcut: lista todas as lojas numa página; paginar quando passar de algumas centenas.
  const [lojasDb, carrosPorLoja, simPorLoja, vendedoresPorLoja] = await Promise.all([
    db
      .select({
        id: lojas.id,
        nome: lojas.nome,
        slug: lojas.slug,
        planoStatus: lojas.planoStatus,
        trialAte: lojas.trialAte,
        asaasSubscriptionId: lojas.asaasSubscriptionId,
        mensalidadeAsaas: lojas.mensalidadeCentavos,
        createdAt: lojas.createdAt,
      })
      .from(lojas)
      .orderBy(desc(lojas.createdAt)),
    db
      .select({
        lojaId: carros.lojaId,
        aVenda: sql<number>`count(*) filter (where ${carros.status} = 'disponivel')`.mapWith(Number),
        total: count(),
      })
      .from(carros)
      .groupBy(carros.lojaId),
    db
      .select({
        lojaId: sim.lojaId,
        recentes: sql<number>`count(*) filter (where ${sim.createdAt} >= ${desde}::timestamptz)`.mapWith(Number),
        total: count(),
      })
      .from(sim)
      .groupBy(sim.lojaId),
    db
      .select({ lojaId: membros.lojaId, n: count() })
      .from(membros)
      .where(and(eq(membros.papel, "vendedor"), eq(membros.ativo, true)))
      .groupBy(membros.lojaId),
  ]);

  const vendedoresDe = new Map(vendedoresPorLoja.map((v) => [v.lojaId, v.n]));
  // Quem tem assinatura paga o que o Asaas cobra hoje; sem ela, vale a faixa pela equipe atual.
  const lista = lojasDb.map((l) => {
    const faixaCentavos = valorPlano(vendedoresDe.get(l.id) ?? 0) * 100;
    return { ...l, faixaCentavos, mensalidadeCentavos: l.mensalidadeAsaas ?? faixaCentavos };
  });

  const carrosDe = new Map(carrosPorLoja.map((c) => [c.lojaId, c]));
  const simDe = new Map(simPorLoja.map((s) => [s.lojaId, s]));
  const { porSituacao, mrrCentavos } = resumoAssinaturas(lista, agora);
  const soma = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((n, x) => n + f(x), 0);
  const uso = [
    { rotulo: "Lojas", valor: lista.length },
    { rotulo: "Carros à venda", valor: soma(carrosPorLoja, (c) => c.aVenda) },
    { rotulo: `Simulações em ${DIAS_RECENTES} dias`, valor: soma(simPorLoja, (s) => s.recentes) },
  ];

  return (
    <div className="grid grid-cols-1 gap-10">
      <header className="grid gap-1">
        <h1 className="font-display text-3xl font-semibold lg:text-[2.5rem]">Administração</h1>
        <p className="text-ink-3">Todas as lojas do AutoGiro, com os números de agora.</p>
      </header>

      <section aria-labelledby="receita-titulo" className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-end">
        <div className="grid gap-1">
          <h2 id="receita-titulo" className="text-sm text-ink-3">
            Receita mensal recorrente (MRR)
          </h2>
          <p className="font-display text-display-s leading-none font-semibold">{formatBRL(mrrCentavos)}</p>
          <p className="text-sm text-ink-3">
            {porSituacao.ativa} {porSituacao.ativa === 1 ? "loja ativa" : "lojas ativas"}, cada uma pela mensalidade dela
          </p>
        </div>
        <dl className="grid grid-cols-3 border-y border-rule">
          {uso.map((s, i) => (
            <div key={s.rotulo} className={i === 0 ? "py-5 pr-4" : "border-l border-rule px-4 py-5"}>
              <dt className="text-sm text-ink-3">{s.rotulo}</dt>
              <dd className="font-display text-3xl font-semibold">{s.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="assinaturas-titulo" className="grid grid-cols-1 gap-4">
        <h2 id="assinaturas-titulo" className="font-display text-xl font-semibold">
          Assinaturas
        </h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-rule bg-rule lg:grid-cols-5">
          {SITUACOES.map((s) => (
            <div key={s.valor} className="grid content-start gap-1 bg-paper p-4 last:col-span-2 lg:p-5 lg:last:col-span-1">
              <dt className="text-sm text-ink-2">{s.rotulo}</dt>
              <dd className="font-display text-3xl font-semibold">{porSituacao[s.valor]}</dd>
              <dd className="text-xs text-ink-3">{s.nota}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="lojas-titulo" className="grid grid-cols-1 gap-4">
        <h2 id="lojas-titulo" className="font-display text-xl font-semibold">
          Lojas
        </h2>
        {lista.length === 0 ? (
          <p className="ticks px-6 py-10 text-ink-2">Nenhuma loja cadastrada ainda.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <table className="w-full min-w-[50rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Lojas, da mais nova para a mais antiga, com situação do plano, mensalidade, carros e simulações
              </caption>
              <thead className="text-ink-3">
                <tr className="border-b border-rule-2">
                  <th scope="col" className="py-3 pr-4 font-normal">Loja</th>
                  <th scope="col" className="py-3 pr-4 font-normal">Situação</th>
                  <th scope="col" className="py-3 pr-4 font-normal">Criada em</th>
                  <th scope="col" className="py-3 pr-4 text-right font-normal">Mensalidade</th>
                  <th scope="col" className="py-3 pr-4 text-right font-normal">Carros à venda</th>
                  <th scope="col" className="py-3 pr-4 text-right font-normal">Simulações ({DIAS_RECENTES} dias)</th>
                  <th scope="col" className="py-3 text-right font-normal">Simulações (total)</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((l) => {
                  const situacao = situacaoPlano(l, agora);
                  const c = carrosDe.get(l.id);
                  const s = simDe.get(l.id);
                  return (
                    <tr key={l.id} className="border-b border-rule">
                      <th scope="row" className="py-3 pr-4 font-normal">
                        <span className="block text-md text-ink">{l.nome}</span>
                        <Link href={`/loja/${l.slug}`} target="_blank" className="text-ink-3 underline-offset-4 hover:underline">
                          /loja/{l.slug}
                        </Link>
                      </th>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex h-7 items-center whitespace-nowrap rounded-full border px-3 text-xs",
                            situacao === "inadimplente" ? "border-error text-error" : "border-rule-2 text-ink",
                          )}
                        >
                          {ROTULO[situacao]}
                        </span>
                        {situacao === "teste" && !l.asaasSubscriptionId && (
                          <span className="mt-1 block text-xs text-ink-3">até {data.format(l.trialAte)}</span>
                        )}
                      </td>
                      <td className="num py-3 pr-4 whitespace-nowrap text-ink-2">{data.format(l.createdAt)}</td>
                      <td className="num py-3 pr-4 text-right whitespace-nowrap">
                        {formatBRL(l.mensalidadeCentavos)}
                        {l.mensalidadeCentavos !== l.faixaCentavos && (
                          <span className="block text-xs text-ink-3">passa a {formatBRL(l.faixaCentavos)}</span>
                        )}
                      </td>
                      <td className="num py-3 pr-4 text-right">
                        {c?.aVenda ?? 0}
                        <span className="text-ink-3"> de {c?.total ?? 0}</span>
                      </td>
                      <td className="num py-3 pr-4 text-right">{s?.recentes ?? 0}</td>
                      <td className="num py-3 text-right">{s?.total ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Carregando() {
  return (
    <div className="grid grid-cols-1 gap-10" aria-busy="true" aria-label="Carregando">
      <div className="h-9 w-56 rounded-card bg-paper-3" />
      <div className="h-24 rounded-card bg-paper-2" />
      <div className="h-28 rounded-card bg-paper-2" />
      <div className="h-64 rounded-card bg-paper-2" />
    </div>
  );
}

export default function AdminPage() {
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
      <main className="mx-auto w-full max-w-(--container) flex-1 px-4 pt-6 pb-16 lg:px-(--gutter) lg:pt-10">
        <Suspense fallback={<Carregando />}>
          <Painel />
        </Suspense>
      </main>
    </div>
  );
}
