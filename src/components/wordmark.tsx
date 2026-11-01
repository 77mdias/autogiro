import Image from "next/image";
import { cn } from "@/lib/utils";

/** Símbolo do logo (velocímetro com a seta) + nome, nas duas cores da marca. */
export function Wordmark({ className, tone = "day" }: { className?: string; tone?: "day" | "night" }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-lg leading-none font-normal tracking-[-0.02em]", className)}>
      <Image src="/mark.png" alt="" width={351} height={272} className="h-6 w-auto" priority />
      <span>
        <span className={tone === "night" ? "text-ink" : "text-navy"}>Auto</span>
        <span className="text-brand">Giro</span>
      </span>
    </span>
  );
}
