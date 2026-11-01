import { formatMilhar } from "@/lib/masks";
import { cn } from "@/lib/utils";

type Specs = { ano: number; km: number; cambio?: string | null; combustivel?: string | null };

/** Ano, km, câmbio e combustível como etiquetas: um fato por etiqueta, sem "·" entre eles. */
export function CarSpecs({ carro, className }: { carro: Specs; className?: string }) {
  const itens = [
    { rotulo: "Ano", valor: String(carro.ano) },
    { rotulo: "Quilometragem", valor: `${formatMilhar(String(carro.km))} km` },
    carro.cambio && { rotulo: "Câmbio", valor: carro.cambio },
    carro.combustivel && { rotulo: "Combustível", valor: carro.combustivel },
  ].filter((i): i is { rotulo: string; valor: string } => !!i);

  return (
    <dl className={cn("flex flex-wrap gap-1.5", className)}>
      {itens.map((i) => (
        <div key={i.rotulo} className="flex h-7 items-center rounded-card bg-paper-2 px-2.5 text-sm text-ink-2">
          <dt className="sr-only">{i.rotulo}</dt>
          <dd className="num font-light">{i.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
