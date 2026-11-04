// Tier de qualidade da cena 3D da landing (docs/landing-3d.md). Puro para rodar no node --test.
export type Tier = "alto" | "medio" | "baixo";

export type SinaisDoAparelho = {
  ponteiroGrosso: boolean; // (hover: none): celular e tablet
  memoriaGb?: number; // navigator.deviceMemory; o Safari não informa
  nucleos?: number; // navigator.hardwareConcurrency
  economiaDeDados?: boolean; // navigator.connection.saveData
};

export function tierDoAparelho(s: SinaisDoAparelho): Tier {
  if (s.economiaDeDados) return "baixo";
  if (!s.ponteiroGrosso) return "alto";
  const memoriaOk = s.memoriaGb === undefined || s.memoriaGb >= 6;
  return memoriaOk && (s.nucleos ?? 4) >= 4 ? "medio" : "baixo";
}

export const DPR_MAX: Record<Tier, number> = { alto: 1.5, medio: 1.25, baixo: 1 };

/** Só no navegador (useEffect). */
export function tierDoNavegador(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return tierDoAparelho({
    ponteiroGrosso: window.matchMedia("(hover: none)").matches,
    memoriaGb: nav.deviceMemory,
    nucleos: nav.hardwareConcurrency,
    economiaDeDados: nav.connection?.saveData,
  });
}
