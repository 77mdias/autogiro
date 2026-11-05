// Sem imports com alias: este arquivo roda direto no `node --test`.

/** Mês "AAAA-MM" de uma data, no fuso de São Paulo (as lojas fecham o mês no horário de Brasília). */
export function mesDe(d: Date): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(d);
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}`;
}

export const mesValido = (v: unknown): v is string => typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

/** Mês vizinho: delta -1 = anterior, +1 = seguinte. */
export function mesVizinho(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const total = a * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Início e fim (exclusivo) do mês no horário de Brasília (UTC-3, sem horário de verão desde 2019). */
export function intervaloMes(mes: string) {
  return { inicio: new Date(`${mes}-01T00:00:00-03:00`), fim: new Date(`${mesVizinho(mes, 1)}-01T00:00:00-03:00`) };
}

/** Comissão como % da venda, com uma casa. null quando não dá para calcular. */
export function percentual(comissaoCentavos: number | null, valorCentavos: number): number | null {
  if (comissaoCentavos == null || valorCentavos <= 0) return null;
  return Math.round((comissaoCentavos / valorCentavos) * 1000) / 10;
}

type Venda = { membroId: string | null; vendedor: string; valorCentavos: number; comissaoCentavos: number | null };

/** Totais por vendedor, do que mais vendeu para o que menos vendeu. Comissão sem valor conta como 0. */
export function resumoPorVendedor(vendas: Venda[]) {
  const por = new Map<string, { vendedor: string; vendas: number; valorCentavos: number; comissaoCentavos: number; semComissao: number }>();
  for (const v of vendas) {
    const chave = v.membroId ?? v.vendedor;
    const r = por.get(chave) ?? { vendedor: v.vendedor, vendas: 0, valorCentavos: 0, comissaoCentavos: 0, semComissao: 0 };
    r.vendas++;
    r.valorCentavos += v.valorCentavos;
    r.comissaoCentavos += v.comissaoCentavos ?? 0;
    if (v.comissaoCentavos == null) r.semComissao++;
    por.set(chave, r);
  }
  return [...por.values()].sort((a, b) => b.valorCentavos - a.valorCentavos);
}
