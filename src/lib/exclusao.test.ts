import { test } from "node:test";
import assert from "node:assert/strict";
import { arquivosDaLoja, confirmouExclusao, contaDeEmail, CONFIRMACAO_EXCLUSAO } from "./exclusao.ts";

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
