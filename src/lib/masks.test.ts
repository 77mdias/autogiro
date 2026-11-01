import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPhone, formatMilhar, reaisToCentavos, slugify, whatsappUrl } from "./masks.ts";

test("telefone", () => {
  assert.equal(formatPhone(""), "");
  assert.equal(formatPhone("1"), "(1");
  assert.equal(formatPhone("1198"), "(11) 98");
  assert.equal(formatPhone("1133334444"), "(11) 3333-4444");
  assert.equal(formatPhone("11987654321"), "(11) 98765-4321");
  assert.equal(formatPhone("(11) 98765-43219999"), "(11) 98765-4321");
});

test("milhar e reais", () => {
  assert.equal(formatMilhar("45000"), "45.000");
  assert.equal(formatMilhar("0045"), "45");
  assert.equal(formatMilhar("0"), "0");
  assert.equal(formatMilhar("1234567"), "1.234.567");
  assert.equal(reaisToCentavos("45.000"), 4500000);
  assert.equal(reaisToCentavos(""), 0);
});

test("slug e whatsapp", () => {
  assert.equal(slugify("  Auto Peças São João! "), "auto-pecas-sao-joao");
  assert.equal(whatsappUrl("(11) 98765-4321", "Olá & tal"), "https://wa.me/5511987654321?text=Ol%C3%A1%20%26%20tal");
});
