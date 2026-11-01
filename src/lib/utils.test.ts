import { test } from "node:test";
import assert from "node:assert/strict";
import { cn } from "./utils.ts";

test("cn trata a escala do DESIGN.md como tamanho de fonte, não cor", () => {
  assert.equal(cn("text-caption font-semibold", "text-primary"), "text-caption font-semibold text-primary");
  assert.equal(cn("text-body-md", "text-sub-lg"), "text-sub-lg");
});
