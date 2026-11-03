"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("autogiro-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("autogiro-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(defaultTone: "day" | "night"): ThemeMode {
  if (typeof document === "undefined") return defaultTone === "night" ? "dark" : "light";
  const explicit = document.documentElement.dataset.mode;
  if (explicit === "dark" || explicit === "light") return explicit;
  return defaultTone === "night" ? "dark" : "light";
}

export function ThemeToggle({
  defaultTone = "day",
  compact = false,
  className,
}: {
  defaultTone?: "day" | "night";
  compact?: boolean;
  className?: string;
}) {
  const mode = useSyncExternalStore(
    subscribeTheme,
    () => getThemeSnapshot(defaultTone),
    () => (defaultTone === "night" ? "dark" : "light"),
  );

  const isDark = mode === "dark";

  function alternarTema() {
    const proximo: ThemeMode = isDark ? "light" : "dark";
    document.documentElement.dataset.mode = proximo;
    try {
      localStorage.setItem("autogiro-theme", proximo);
    } catch {
      // Sem acesso ao localStorage em modo restrito; mantém no DOM da sessão
    }
    window.dispatchEvent(new Event("autogiro-theme-change"));
  }

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-pressed={isDark}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rule-2 bg-paper px-3.5 text-sm text-ink-2 transition-[background-color,border-color,color,transform] duration-(--dur-short) hover:border-ink hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none",
        compact && "w-11 px-0",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon className="size-4 shrink-0 text-ink-2" strokeWidth={1.75} aria-hidden />
      )}
      {!compact && <span className="hidden sm:inline">{isDark ? "Modo claro" : "Modo escuro"}</span>}
    </button>
  );
}
