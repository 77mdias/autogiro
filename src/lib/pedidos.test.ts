import { test } from "node:test";
import assert from "node:assert/strict";
import { diferencas, fotosAprovadas, type CamposCarro } from "./pedidos.ts";

const carro: CamposCarro = {
  marca: "Honda",
  modelo: "Civic",
  ano: 2019,
  km: 58000,
  precoCentavos: 10_490_000,
  cambio: "Automático",
  combustivel: "Flex",
  cor: null,
  descricao: null,
  status: "disponivel",
};

test("diferencas lista só o que mudou, com antes e depois", () => {
  const d = diferencas(carro, { ...carro, precoCentavos: 9_990_000, status: "vendido" });
  assert.deepEqual(
    d.map((x) => [x.campo, x.de, x.para]),
    [
      ["precoCentavos", 10_490_000, 9_990_000],
      ["status", "disponivel", "vendido"],
    ],
  );
});

test("diferencas trata vazio e null como iguais", () => {
  assert.deepEqual(diferencas(carro, { ...carro, cor: undefined as unknown as null }), []);
  assert.equal(diferencas(carro, { ...carro, cor: "Preto" })[0]?.rotulo, "Cor");
});

test("fotosAprovadas tira as removidas e põe as novas no fim", () => {
  assert.deepEqual(fotosAprovadas(["a", "b", "c"], { fotosRemover: ["b", "x"], fotosNovas: ["d"] }), ["a", "c", "d"]);
});

test("fotosAprovadas recusa passar de 15 fotos", () => {
  const atuais = Array.from({ length: 14 }, (_, i) => `f${i}`);
  assert.equal(fotosAprovadas(atuais, { fotosRemover: [], fotosNovas: ["n1", "n2"] }), null);
  assert.equal(fotosAprovadas(atuais, { fotosRemover: ["f0"], fotosNovas: ["n1", "n2"] })?.length, 15);
});
