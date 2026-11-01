"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Painel = { titulo: string; texto: string; tela: string; alt: string };

/**
 * Desktop: a captura fica presa à esquerda e troca conforme o painel da direita passa.
 * Abaixo de 60rem não há trava: cada painel mostra a própria captura.
 */
export function PinnedRun({ paineis }: { paineis: Painel[] }) {
  const [ativo, setAtivo] = useState(0);
  const lista = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const itens = [...lista.current!.children] as HTMLElement[];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setAtivo(Number(e.target.getAttribute("data-i")))),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    itens.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-(--gap-columns) lg:grid-cols-12">
      <div className="hidden lg:sticky lg:top-24 lg:col-span-6 lg:block lg:h-[min(44rem,calc(100dvh-8rem))] lg:self-start">
        {paineis.map((p, i) => (
          <Image
            key={p.tela}
            src={p.tela}
            alt={i === ativo ? p.alt : ""}
            width={780}
            height={1688}
            sizes="22rem"
            className="absolute inset-y-0 left-1/2 h-full w-auto -translate-x-1/2 rounded-card outline-1 -outline-offset-1 outline-rule-2 transition-opacity duration-(--dur-long) ease-out motion-reduce:transition-none"
            style={{ opacity: i === ativo ? 1 : 0 }}
          />
        ))}
      </div>
      <ol ref={lista} className="grid gap-16 lg:col-span-5 lg:col-start-8 lg:gap-0">
        {paineis.map((p, i) => (
          <li key={p.tela} data-i={i} className="grid content-center gap-4 lg:min-h-[70dvh]">
            <h3 className="font-display text-title font-light">{p.titulo}</h3>
            <p className="max-w-[40ch] text-lead text-ink-2">{p.texto}</p>
            <Image
              src={p.tela}
              alt={p.alt}
              width={780}
              height={1688}
              sizes="(min-width: 40rem) 22rem, 80vw"
              className="mt-4 h-auto w-full max-w-[22rem] rounded-card outline-1 -outline-offset-1 outline-rule-2 lg:hidden"
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
