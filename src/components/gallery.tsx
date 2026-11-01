"use client";

import { useEffect, useRef, useState } from "react";
import { Car } from "lucide-react";

/** Galeria com arrasto nativo (scroll-snap) e contador; no desktop, miniaturas levam à foto. */
export function Gallery({ fotos, alt }: { fotos: string[]; alt: string }) {
  const trilho = useRef<HTMLUListElement>(null);
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setAtual(Number((e.target as HTMLElement).dataset.i))),
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll("li").forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);

  if (fotos.length === 0) {
    return (
      <div className="grid aspect-[4/3] place-items-center bg-paper-2 lg:rounded-card">
        <Car className="size-10 text-ink-3" strokeWidth={1.5} aria-hidden />
      </div>
    );
  }

  const ir = (i: number) =>
    trilho.current?.children[i]?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });

  return (
    <div className="grid gap-3">
      <div className="relative">
        <ul
          ref={trilho}
          tabIndex={0}
          aria-label={`Fotos do ${alt}`}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus lg:rounded-card [&::-webkit-scrollbar]:hidden"
        >
          {fotos.map((src, i) => (
            <li key={src} data-i={i} className="relative aspect-[4/3] w-full shrink-0 snap-start bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos servidas direto pelo R2 */}
              <img
                src={src}
                alt={i === 0 ? alt : ""}
                fetchPriority={i === 0 ? "high" : undefined}
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 size-full object-cover"
              />
            </li>
          ))}
        </ul>
        {fotos.length > 1 && (
          <p className="num pointer-events-none absolute right-3 bottom-3 rounded-full bg-ink/80 px-3 py-1 text-sm text-paper" aria-live="polite">
            {atual + 1} de {fotos.length}
          </p>
        )}
      </div>
      {fotos.length > 1 && (
        <ul className="hidden grid-cols-6 gap-2 lg:grid">
          {fotos.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === atual ? "true" : undefined}
                className="relative block aspect-[4/3] w-full overflow-hidden rounded-card outline-2 outline-offset-2 outline-transparent transition-opacity duration-(--dur-micro) aria-[current]:outline-ink focus-visible:outline-focus motion-reduce:transition-none [&:not([aria-current])]:opacity-70 hover:opacity-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura da mesma foto */}
                <img src={src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
