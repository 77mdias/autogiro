import { test } from "node:test";
import assert from "node:assert/strict";
import { planoLiberado } from "./plano.ts";

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
