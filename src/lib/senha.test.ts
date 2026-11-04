import { test } from "node:test";
import assert from "node:assert/strict";
import { conferirSenha, hashSenha, hashToken, novoToken } from "./senha.ts";

test("senha", async () => {
  const h = await hashSenha("segredo-forte-1");
  assert.match(h, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
  assert.notEqual(h, await hashSenha("segredo-forte-1"), "salt diferente a cada hash");
  assert.equal(await conferirSenha("segredo-forte-1", h), true);
  assert.equal(await conferirSenha("segredo-forte-2", h), false);
  assert.equal(await conferirSenha("x", "lixo"), false);
});

test("token", () => {
  const { token, tokenHash } = novoToken();
  assert.equal(token.length, 43);
  assert.equal(hashToken(token), tokenHash);
  assert.notEqual(novoToken().token, token);
});
