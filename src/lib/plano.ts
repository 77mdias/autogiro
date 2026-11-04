// Sem imports com alias: este arquivo roda direto no `node --test`.

export const PLANO_VALOR_REAIS = 149;
export const TRIAL_DIAS = 7;

export type PlanoLoja = {
  planoStatus: "trial" | "ativo" | "inadimplente" | "cancelado";
  trialAte: Date;
  asaasSubscriptionId: string | null;
};

/**
 * Painel e vitrine só funcionam com plano em dia. No teste grátis, quem já assinou segue liberado
 * até o webhook da primeira cobrança decidir (confirmada → ativo, vencida → inadimplente).
 */
export function planoLiberado(l: PlanoLoja, agora = new Date()) {
  if (l.planoStatus === "ativo") return true;
  if (l.planoStatus === "trial") return l.asaasSubscriptionId != null || agora < l.trialAte;
  return false;
}

/** Como o painel do administrador agrupa as lojas. "teste_vencido" = acabou o teste sem assinar. */
export type Situacao = "teste" | "teste_vencido" | "ativa" | "inadimplente" | "cancelada";

export function situacaoPlano(l: PlanoLoja, agora = new Date()): Situacao {
  if (l.planoStatus === "ativo") return "ativa";
  if (l.planoStatus === "inadimplente") return "inadimplente";
  if (l.planoStatus === "cancelado") return "cancelada";
  return planoLiberado(l, agora) ? "teste" : "teste_vencido";
}

/** Contagem por situação e MRR (só lojas ativas pagam; centavos, como no resto do app). */
export function resumoAssinaturas(lojas: PlanoLoja[], agora = new Date()) {
  const porSituacao: Record<Situacao, number> = { teste: 0, teste_vencido: 0, ativa: 0, inadimplente: 0, cancelada: 0 };
  for (const l of lojas) porSituacao[situacaoPlano(l, agora)]++;
  return { porSituacao, mrrCentavos: porSituacao.ativa * PLANO_VALOR_REAIS * 100 };
}
