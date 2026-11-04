"use client";

import { useEffect, useRef } from "react";

/** Marca o bloco como visto uma vez; o CSS (landing.css) acende os filhos em sequência. */
export function Reveal({ as: Tag = "div", className, children }: { as?: "div" | "ol" | "ul"; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.classList.add("is-in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as React.Ref<never>} className={`lp-reveal ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
