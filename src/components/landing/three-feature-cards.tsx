"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { FeatureSceneKind } from "./three-feature-canvas";

const ThreeFeatureCanvas = dynamic(
  () => import("./three-feature-canvas").then((m) => m.ThreeFeatureCanvas),
  { ssr: false },
);

type CardItem = {
  kind: FeatureSceneKind;
  etiqueta: string;
  numero: string;
  unidade: string;
  titulo: string;
  texto: string;
  detalhe: string;
  span: string;
  horizontal?: boolean;
};

const CARDS: CardItem[] = [
  {
    kind: "vitrine",
    etiqueta: "GIRO DE ESTOQUE · COMPRESSÃO NO CELULAR",
    numero: "15",
    unidade: "fotos/carro",
    titulo: "Vitrine pronta no pátio em menos de 1 minuto",
    texto:
      "Tire até 15 fotos pelo celular: o AutoGiro redimensiona tudo automaticamente antes do envio e publica sua loja num link único.",
    detalhe: "Busca por marca, modelo, versão e filtro de vendidos sem recarregar.",
    span: "lg:col-span-7",
  },
  {
    kind: "cofre",
    etiqueta: "COFRE PRIVADO · PROTEÇÃO LGPD",
    numero: "5",
    unidade: "min por chave",
    titulo: "CNH trancada com link assinado e exclusão aos 90 dias",
    texto:
      "O documento do comprador nunca fica público: só a sua loja autenticada abre a chave temporária de 5 minutos.",
    detalhe: "Retenção automática de 90 dias com limpeza diária.",
    span: "lg:col-span-5",
  },
  {
    kind: "radar",
    etiqueta: "CONVERSÃO DIRETA · ZERO INTERMEDIÁRIOS",
    numero: "100%",
    unidade: "no seu WhatsApp",
    titulo: "Cada simulação chega com entrada, parcelas e CNH num toque",
    texto:
      "Em vez de responder curioso perguntando preço, você recebe o interessado com carro escolhido, valor de entrada, prazo de 12x a 60x e CNH anexada.",
    detalhe: "Um toque abre a conversa no WhatsApp já preenchida com o nome do cliente e o carro.",
    span: "lg:col-span-12",
    horizontal: true,
  },
];

function InteractiveThreeCard({ item }: { item: CardItem }) {
  const [hovered, setHovered] = useState(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pointerRef.current.x = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    pointerRef.current.y = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
  }

  function handlePointerLeave() {
    setHovered(false);
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
  }

  return (
    <article
      onPointerEnter={() => setHovered(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`ticks group relative grid overflow-hidden bg-paper-2 transition-colors duration-(--dur-short) hover:bg-paper-3/60 ${item.span} ${
        item.horizontal ? "lg:grid-cols-12 lg:items-center" : "content-between"
      }`}
    >
      {/* Palco 3D interativo em Three.js */}
      <div
        ref={stageRef}
        className={`relative overflow-hidden border-b border-rule bg-paper/60 ${
          item.horizontal ? "h-64 lg:col-span-5 lg:h-full lg:min-h-72 lg:border-r lg:border-b-0" : "h-56 sm:h-64"
        }`}
      >
        <ThreeFeatureCanvas kind={item.kind} hovered={hovered} pointerRef={pointerRef} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-rule-2 bg-paper/85 px-3 py-1 text-xs font-medium text-ink-2"
        >
          <span className={item.kind === "radar" ? "size-2 rounded-full bg-signal" : "size-2 rounded-full bg-brand"} />
          <span>{item.etiqueta}</span>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 bottom-3 text-xs text-ink-3"
        >
          Cena 3D interativa
        </span>
      </div>

      {/* Conteúdo de dados e vantagens */}
      <div className={`grid gap-4 p-6 sm:p-8 ${item.horizontal ? "lg:col-span-7 lg:p-10" : ""}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule pb-4">
          <p className="num font-display text-display-s font-semibold text-ink">
            {item.numero}
            <span className="u font-sans font-normal">&nbsp;{item.unidade}</span>
          </p>
          <span className="text-sm text-ink-3">{item.detalhe}</span>
        </div>
        <h3 className="font-display text-title font-semibold text-ink">{item.titulo}</h3>
        <p className="max-w-[58ch] text-ink-2">{item.texto}</p>
      </div>
    </article>
  );
}

export function ThreeFeatureCards() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-(--gap-columns)">
      {CARDS.map((item) => (
        <InteractiveThreeCard key={item.kind} item={item} />
      ))}
    </div>
  );
}
