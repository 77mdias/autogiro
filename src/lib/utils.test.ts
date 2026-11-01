import { test } from "node:test";
import assert from "node:assert/strict";
import { cn, formatBRL } from "./utils.ts";

test("cn trata a escala da Hallmark como tamanho de fonte, não cor", () => {
  assert.equal(cn("text-title font-medium", "text-ink"), "text-title font-medium text-ink");
  assert.equal(cn("text-md", "text-section"), "text-section");
});

test("formatBRL omite centavos só quando o valor é redondo", () => {
  assert.equal(formatBRL(12490000).replace(/\s/g, " "), "R$ 124.900");
  assert.equal(formatBRL(12345).replace(/\s/g, " "), "R$ 123,45");
});
