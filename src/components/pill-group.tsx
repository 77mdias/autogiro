/** Grupo de rádios nativos estilizados como pills: um toque, sem JS, acessível por teclado. */
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
    <fieldset className="grid grid-cols-1 gap-2">
      <legend className="mb-2 text-body-md font-medium">{legend}</legend>
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
              <span className="inline-flex h-11 items-center rounded-sm border border-input bg-popover px-4 text-body-md font-medium transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
