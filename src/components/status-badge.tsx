import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: "disponivel" | "vendido"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-xs",
        status === "vendido" ? "bg-ink text-paper" : "border border-rule-2 bg-paper text-ink",
        className,
      )}
    >
      {status === "vendido" ? "Vendido" : "Disponível"}
    </span>
  );
}
