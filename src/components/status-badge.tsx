import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: "disponivel" | "vendido"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-caption font-semibold",
        status === "vendido" ? "bg-foreground text-background" : "border border-brand bg-card text-primary",
        className,
      )}
    >
      {status === "vendido" ? "Vendido" : "Disponível"}
    </span>
  );
}
