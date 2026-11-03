import { test } from "node:test";
import assert from "node:assert/strict";
import { tierDoAparelho } from "./landing-tier.ts";

test("desktop com mouse é alto", () => {
  assert.equal(tierDoAparelho({ ponteiroGrosso: false, memoriaGb: 4, nucleos: 2 }), "alto");
});

test("economia de dados derruba para baixo em qualquer aparelho", () => {
  assert.equal(tierDoAparelho({ ponteiroGrosso: false, economiaDeDados: true }), "baixo");
});

test("celular sem deviceMemory (Safari) com 4+ núcleos é médio", () => {
  assert.equal(tierDoAparelho({ ponteiroGrosso: true, nucleos: 6 }), "medio");
});

test("Android de 4 GB é baixo mesmo com 8 núcleos", () => {
  assert.equal(tierDoAparelho({ ponteiroGrosso: true, memoriaGb: 4, nucleos: 8 }), "baixo");
});

test("celular de 8 GB com 8 núcleos é médio", () => {
  assert.equal(tierDoAparelho({ ponteiroGrosso: true, memoriaGb: 8, nucleos: 8 }), "medio");
});
