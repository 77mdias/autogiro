import { test } from "node:test";
import assert from "node:assert/strict";
import { intervaloMes, mesDe, mesValido, mesVizinho, percentual, resumoPorVendedor } from "./vendas.ts";

test("mesDe usa o horário de Brasília", () => {
  // 1º de dezembro, 01:00 UTC = 30 de novembro, 22:00 em Brasília
  assert.equal(mesDe(new Date("2026-12-01T01:00:00Z")), "2026-11");
  assert.equal(mesDe(new Date("2026-12-01T03:00:00Z")), "2026-12");
});

test("mesVizinho atravessa a virada do ano", () => {
  assert.equal(mesVizinho("2026-12", 1), "2027-01");
  assert.equal(mesVizinho("2026-01", -1), "2025-12");
});

test("intervaloMes vai da meia-noite de Brasília do dia 1 até o mês seguinte", () => {
  const { inicio, fim } = intervaloMes("2026-11");
  assert.equal(inicio.toISOString(), "2026-11-01T03:00:00.000Z");
  assert.equal(fim.toISOString(), "2026-12-01T03:00:00.000Z");
});

test("mesValido aceita só AAAA-MM", () => {
  assert.ok(mesValido("2026-11"));
  assert.ok(!mesValido("2026-13"));
  assert.ok(!mesValido("2026-1"));
  assert.ok(!mesValido(undefined));
});

test("percentual com uma casa e null sem comissão", () => {
  assert.equal(percentual(150_000, 10_000_000), 1.5);
  assert.equal(percentual(null, 10_000_000), null);
  assert.equal(percentual(100, 0), null);
});

test("resumoPorVendedor soma por vendedor e conta as sem comissão", () => {
  const r = resumoPorVendedor([
    { membroId: "a", vendedor: "Ana", valorCentavos: 100, comissaoCentavos: 10 },
    { membroId: "b", vendedor: "Bia", valorCentavos: 500, comissaoCentavos: null },
    { membroId: "a", vendedor: "Ana", valorCentavos: 300, comissaoCentavos: null },
  ]);
  assert.deepEqual(r, [
    { vendedor: "Bia", vendas: 1, valorCentavos: 500, comissaoCentavos: 0, semComissao: 1 },
    { vendedor: "Ana", vendas: 2, valorCentavos: 400, comissaoCentavos: 10, semComissao: 1 },
  ]);
});
