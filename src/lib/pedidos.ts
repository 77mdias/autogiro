// Sem imports com alias: este arquivo roda direto no `node --test`.

export const MAX_FOTOS = 15;

export type CamposCarro = {
  marca: string;
  modelo: string;
  ano: number;
  km: number;
  precoCentavos: number;
  cambio: string | null;
  combustivel: string | null;
  cor: string | null;
  descricao: string | null;
  status: "disponivel" | "vendido";
};

/** O que o vendedor pediu: os campos completos do carro e as fotos a pôr e a tirar. */
export type MudancasCarro = CamposCarro & { fotosNovas: string[]; fotosRemover: string[] };

const ROTULOS: Record<keyof CamposCarro, string> = {
  marca: "Marca",
  modelo: "Modelo",
  ano: "Ano",
  km: "Quilometragem",
  precoCentavos: "Preço",
  cambio: "Câmbio",
  combustivel: "Combustível",
  cor: "Cor",
  descricao: "Descrição",
  status: "Situação",
};

/** O que o pedido muda em relação ao carro de agora: é o que o gestor olha para aprovar. */
export function diferencas(atual: CamposCarro, pedido: CamposCarro) {
  return (Object.keys(ROTULOS) as (keyof CamposCarro)[])
    .filter((k) => (atual[k] ?? null) !== (pedido[k] ?? null))
    .map((campo) => ({ campo, rotulo: ROTULOS[campo], de: atual[campo] ?? null, para: pedido[campo] ?? null }));
}

/** Fotos do carro depois de aprovar: sem as removidas, com as novas no fim. null = passaria do limite. */
export function fotosAprovadas(atuais: string[], m: Pick<MudancasCarro, "fotosNovas" | "fotosRemover">): string[] | null {
  const remover = new Set(m.fotosRemover);
  const fotos = [...atuais.filter((k) => !remover.has(k)), ...m.fotosNovas];
  return fotos.length > MAX_FOTOS ? null : fotos;
}
