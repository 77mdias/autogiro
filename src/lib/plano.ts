// Sem imports com alias: este arquivo roda direto no `node --test`.

export const TRIAL_DIAS = 15;
/** Vendedores ativos mais convites em aberto, por loja. Acima disso, fala com a AutoGiro. */
export const MAX_VENDEDORES = 20;

/** Mensalidade por número de vendedores ativos (o gestor não conta). `ate` inclusivo, em ordem. */
export const FAIXAS = [
  { ate: 0, reais: 39, rotulo: "Individual" },
  { ate: 4, reais: 99, rotulo: "1 a 4 vendedores" },
  { ate: 10, reais: 139, rotulo: "5 a 10 vendedores" },
  { ate: MAX_VENDEDORES, reais: 169, rotulo: `11 a ${MAX_VENDEDORES} vendedores` },
] as const;

/** A faixa de uma loja pelos vendedores ativos. Acima do limite fica na última (convidar já é bloqueado). */
export const faixaPlano = (vendedores: number) => FAIXAS.find((f) => vendedores <= f.ate) ?? FAIXAS[FAIXAS.length - 1];
export const valorPlano = (vendedores: number) => faixaPlano(vendedores).reais;

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

/** Contagem por situação e MRR (só lojas ativas pagam, cada uma o valor da sua mensalidade; centavos). */
export function resumoAssinaturas(lojas: (PlanoLoja & { mensalidadeCentavos: number })[], agora = new Date()) {
  const porSituacao: Record<Situacao, number> = { teste: 0, teste_vencido: 0, ativa: 0, inadimplente: 0, cancelada: 0 };
  let mrrCentavos = 0;
  for (const l of lojas) {
    const s = situacaoPlano(l, agora);
    porSituacao[s]++;
    if (s === "ativa") mrrCentavos += l.mensalidadeCentavos;
  }
  return { porSituacao, mrrCentavos };
}
