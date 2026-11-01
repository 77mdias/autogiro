import { Check } from "lucide-react";

/** Grupo de rádios nativos estilizados como pílulas: um toque, sem JS, acessível por teclado. */
export function PillGroup({
  name,
  legend,
  options,
  defaultValue,
  required,
}: {
  name: string;
  legend: string;
  options: readonly (string | { value: string; label: string })[];
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <fieldset className="grid min-w-0 grid-cols-1 gap-2">
      <legend className="mb-2 text-sm text-ink-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const { value, label } = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={value}
                defaultChecked={defaultValue === value}
                required={required}
                className="peer sr-only"
              />
              <span className="inline-flex h-11 items-center gap-2 rounded-full border border-rule-2 bg-paper px-4 text-sm text-ink-2 transition-colors duration-(--dur-micro) peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus hover:border-ink motion-reduce:transition-none">
                <Check className="hidden size-4 [:checked+*_&]:inline" aria-hidden />
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
