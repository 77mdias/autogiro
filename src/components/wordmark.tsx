import Image from "next/image";
import { cn } from "@/lib/utils";

/** Símbolo do logo (velocímetro com a seta) + nome, adaptável automaticamente ao tema claro e escuro. */
export function Wordmark({ className }: { className?: string; tone?: "day" | "night" }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-lg leading-none font-semibold tracking-[-0.02em]", className)}>
      <Image src="/mark.png" alt="" width={351} height={272} className="h-6 w-auto" priority />
      <span>
        <span className="text-ink">Auto</span>
        <span className="text-brand">Giro</span>
      </span>
    </span>
  );
}
