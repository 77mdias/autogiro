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
