import { test } from "node:test";
import assert from "node:assert/strict";
import { ehAdmin } from "./admin.ts";

test("admin só com e-mail na lista, sem diferenciar maiúsculas nem espaços", () => {
  const lista = " dono@autogiro.com.br , Socio@AutoGiro.com.br";
  assert.equal(ehAdmin("dono@autogiro.com.br", lista), true);
  assert.equal(ehAdmin("socio@autogiro.com.br", lista), true);
  assert.equal(ehAdmin("loja@exemplo.com", lista), false);
  assert.equal(ehAdmin("dono@autogiro.com", lista), false); // sem casar por prefixo
});

test("lista vazia ou sessão sem e-mail não libera ninguém", () => {
  assert.equal(ehAdmin("dono@autogiro.com.br", ""), false);
  assert.equal(ehAdmin("", ""), false);
  assert.equal(ehAdmin("", "dono@autogiro.com.br,,"), false);
  assert.equal(ehAdmin(null, "dono@autogiro.com.br"), false);
  assert.equal(ehAdmin(undefined, "dono@autogiro.com.br"), false);
});
