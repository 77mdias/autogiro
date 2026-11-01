"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatMilhar, formatPhone } from "@/lib/masks";
import { cn } from "@/lib/utils";

const MASKS = { phone: formatPhone, milhar: formatMilhar } as const;

type Props = Omit<React.ComponentProps<"input">, "onChange" | "value" | "defaultValue"> & {
  mask: keyof typeof MASKS;
  defaultValue?: string;
  /** Valor controlado externamente (opcional). */
  value?: string;
  onValueChange?: (formatted: string) => void;
  prefix?: string;
  suffix?: string;
};

/** Input com máscara; envia o texto formatado e o servidor extrai os dígitos. */
export function MaskedInput({ mask, defaultValue = "", value, onValueChange, prefix, suffix, className, ...props }: Props) {
  const [inner, setInner] = useState(() => MASKS[mask](defaultValue));
  const shown = value ?? inner;
  const input = (
    <Input
      {...props}
      inputMode="numeric"
      value={shown}
      onChange={(e) => {
        const v = MASKS[mask](e.target.value);
        setInner(v);
        onValueChange?.(v);
      }}
      className={cn(prefix && "pl-11", suffix && "pr-12", className)}
    />
  );
  if (!prefix && !suffix) return input;
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-3">{prefix}</span>}
      {input}
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-3">{suffix}</span>}
    </div>
  );
}
