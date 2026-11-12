// Sem imports com alias: este arquivo roda direto no `node --test`.
import type { MudancasCarro } from "./pedidos.ts";

/** O que o garagista digita para confirmar que quer excluir a conta. */
export const CONFIRMACAO_EXCLUSAO = "EXCLUIR";

export const confirmouExclusao = (texto: string) => texto.trim().toUpperCase() === CONFIRMACAO_EXCLUSAO;

/** Fotos no R2 público de uma loja: as dos carros e as novas de pedidos pendentes, sem repetir. */
export function arquivosDaLoja(fotosCarros: string[][], pedidos: Pick<MudancasCarro, "fotosNovas">[]) {
  return [...new Set([...fotosCarros.flat(), ...pedidos.flatMap((p) => p.fotosNovas)])];
}

/** O `sub` da sessão é o id (UUID) de `usuarios` na conta de e-mail; no Google é numérico. */
export const contaDeEmail = (sub: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub);

/**
 * O que cancelar no Asaas antes de apagar a loja. Na fase 1 a loja é liberada com o cliente (`cus_`) e o id
 * da assinatura só chega na cobrança seguinte: aí cancela as assinaturas ativas do cliente. Paga sem
 * cliente conhecido: recusa, para nunca apagar uma loja que continua sendo cobrada.
 */
export function cobrancaNaExclusao(l: { sub: string | null; cliente: string | null; planoStatus: string }) {
  if (l.sub) return "assinatura";
  if (l.cliente) return "cliente";
  return l.planoStatus === "ativo" || l.planoStatus === "inadimplente" ? "recusar" : "nada";
}

/** Chaves pedidas ao R2 que não voltaram na lista de apagadas. */
export function naoApagados(pedidos: string[], apagados: string[]) {
  const ok = new Set(apagados);
  return pedidos.filter((k) => !ok.has(k));
}
