import { test } from "node:test";
import assert from "node:assert/strict";
import { faixaPlano, planoLiberado, resumoAssinaturas, situacaoPlano, valorPlano } from "./plano.ts";

const agora = new Date("2026-11-10T12:00:00Z");
const antes = new Date("2026-11-09T12:00:00Z");
const depois = new Date("2026-11-11T12:00:00Z");

test("plano liberado", () => {
  assert.equal(planoLiberado({ planoStatus: "trial", trialAte: depois, asaasSubscriptionId: null }, agora), true);
  assert.equal(planoLiberado({ planoStatus: "trial", trialAte: antes, asaasSubscriptionId: null }, agora), false);
  assert.equal(planoLiberado({ planoStatus: "trial", trialAte: antes, asaasSubscriptionId: "sub_1" }, agora), true);
  assert.equal(planoLiberado({ planoStatus: "ativo", trialAte: antes, asaasSubscriptionId: "sub_1" }, agora), true);
  assert.equal(planoLiberado({ planoStatus: "inadimplente", trialAte: depois, asaasSubscriptionId: "sub_1" }, agora), false);
  assert.equal(planoLiberado({ planoStatus: "cancelado", trialAte: depois, asaasSubscriptionId: null }, agora), false);
});

test("situação e resumo das assinaturas para o administrador", () => {
  const m = { mensalidadeCentavos: 9_900 };
  const lojas = [
    { planoStatus: "trial", trialAte: depois, asaasSubscriptionId: null, ...m },
    { planoStatus: "trial", trialAte: antes, asaasSubscriptionId: "sub_1", ...m }, // assinou no teste: segue liberada
    { planoStatus: "trial", trialAte: antes, asaasSubscriptionId: null, ...m },
    { planoStatus: "ativo", trialAte: antes, asaasSubscriptionId: "sub_2", mensalidadeCentavos: 3_900 },
    { planoStatus: "ativo", trialAte: antes, asaasSubscriptionId: "sub_3", mensalidadeCentavos: 16_900 },
    { planoStatus: "inadimplente", trialAte: antes, asaasSubscriptionId: "sub_4", ...m },
    { planoStatus: "cancelado", trialAte: antes, asaasSubscriptionId: null, ...m },
  ] as const;
  assert.equal(situacaoPlano(lojas[2], agora), "teste_vencido");
  const r = resumoAssinaturas([...lojas], agora);
  assert.deepEqual(r.porSituacao, { teste: 2, teste_vencido: 1, ativa: 2, inadimplente: 1, cancelada: 1 });
  assert.equal(r.mrrCentavos, 3_900 + 16_900); // só as ativas, cada uma pelo seu valor
  assert.deepEqual(resumoAssinaturas([], agora), { porSituacao: { teste: 0, teste_vencido: 0, ativa: 0, inadimplente: 0, cancelada: 0 }, mrrCentavos: 0 });
});

test("mensalidade pela faixa de vendedores ativos", () => {
  assert.deepEqual([0, 1, 4, 5, 10, 11, 20, 25].map(valorPlano), [59, 99, 99, 139, 139, 169, 169, 169]);
  assert.equal(faixaPlano(0).rotulo, "Individual");
  assert.equal(faixaPlano(7).rotulo, "5 a 10 vendedores");
});
