import { test } from "node:test";
import assert from "node:assert/strict";
import { arquivosDaLoja, cobrancaNaExclusao, confirmouExclusao, contaDeEmail, CONFIRMACAO_EXCLUSAO, naoApagados } from "./exclusao.ts";

test("confirmação da exclusão", () => {
  assert.equal(CONFIRMACAO_EXCLUSAO, "EXCLUIR");
  assert.equal(confirmouExclusao("EXCLUIR"), true);
  assert.equal(confirmouExclusao("  excluir "), true);
  assert.equal(confirmouExclusao("excluir conta"), false);
  assert.equal(confirmouExclusao(""), false);
});

test("arquivos da loja sem repetir", () => {
  assert.deepEqual(arquivosDaLoja([["a.jpg", "b.jpg"], ["c.jpg"]], [{ fotosNovas: ["b.jpg", "d.jpg"] }]), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);
  assert.deepEqual(arquivosDaLoja([], []), []);
});

test("conta de e-mail ou Google", () => {
  assert.equal(contaDeEmail("0b6f4c1e-6d1a-4f1e-9a43-2a7d1c0e9b11"), true);
  assert.equal(contaDeEmail("109876543210987654321"), false);
});

test("o que cancelar no Asaas ao apagar a loja", () => {
  assert.equal(cobrancaNaExclusao({ sub: "sub_1", cliente: "cus_1", planoStatus: "ativo" }), "assinatura");
  // Fase 1: liberada com o cliente, a assinatura ainda não chegou pelo webhook.
  assert.equal(cobrancaNaExclusao({ sub: null, cliente: "cus_1", planoStatus: "ativo" }), "cliente");
  assert.equal(cobrancaNaExclusao({ sub: null, cliente: "cus_1", planoStatus: "cancelado" }), "cliente");
  // Paga sem cliente conhecido: o app não sabe o que cancelar.
  assert.equal(cobrancaNaExclusao({ sub: null, cliente: null, planoStatus: "ativo" }), "recusar");
  assert.equal(cobrancaNaExclusao({ sub: null, cliente: null, planoStatus: "inadimplente" }), "recusar");
  assert.equal(cobrancaNaExclusao({ sub: null, cliente: null, planoStatus: "trial" }), "nada");
  assert.equal(cobrancaNaExclusao({ sub: null, cliente: null, planoStatus: "cancelado" }), "nada");
});

test("arquivos que o R2 não apagou", () => {
  assert.deepEqual(naoApagados(["a", "b", "c"], ["a", "c"]), ["b"]);
  assert.deepEqual(naoApagados(["a"], ["a"]), []);
});
