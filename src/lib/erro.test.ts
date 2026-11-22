import { test } from "node:test";
import assert from "node:assert/strict";
import { codigoDoErro, tipoDoErro } from "./erro.ts";

test("sem internet vence qualquer mensagem", () => {
  assert.equal(tipoDoErro(new Error("Failed to fetch"), false), "offline");
});

test("arquivo de versão antiga é atualização", () => {
  assert.equal(tipoDoErro(new TypeError("Failed to fetch dynamically imported module: /_next/static/x.js")), "atualizacao");
  assert.equal(tipoDoErro(Object.assign(new Error("Loading chunk 3 failed"), { name: "ChunkLoadError" })), "atualizacao");
});

test("rede caiu no meio do caminho é conexão", () => {
  assert.equal(tipoDoErro(new TypeError("Failed to fetch")), "conexao");
  assert.equal(tipoDoErro(new TypeError("Load failed")), "conexao");
});

test("o resto é do servidor, inclusive valor que não é Error", () => {
  assert.equal(tipoDoErro(new Error("An error occurred in the Server Components render.")), "servidor");
  assert.equal(tipoDoErro("boom"), "servidor");
  assert.equal(tipoDoErro(undefined), "servidor");
});

test("código só para digest do servidor", () => {
  assert.equal(codigoDoErro(Object.assign(new Error("x"), { digest: "1055119853" })), "1055119853");
  assert.equal(codigoDoErro(Object.assign(new Error("x"), { digest: "NEXT_REDIRECT;;/painel" })), undefined);
  assert.equal(codigoDoErro(new Error("x")), undefined);
  assert.equal(codigoDoErro(null), undefined);
});
