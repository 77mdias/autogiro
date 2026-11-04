"use client";

import { KageClothCard, type KageGlowSpot } from "./kage-cloth-card";


type GalleryChapter = {
  id: string;
  code: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  metaLeft: string;
  metaRight: string;
  imageSrc: string;
  glows: KageGlowSpot[];
};

const GALLERY_CHAPTERS: GalleryChapter[] = [
  {
    id: "patio",
    code: "I · 01",
    eyebrow: "Capítulo 01 · Pátio",
    title: "O Pátio sob Controle",
    subtitle:
      "Cada vaga tem custo diário. Enxergue de imediato quem acabou de chegar e quem já consome margem.",
    metaLeft: "GARAGEM · ENTRADA DE ESTOQUE",
    metaRight: "Z +0.0m · 35mm",
    imageSrc: "/landing/web/garagem.webp",
    glows: [
      {
        x: "28%",
        y: "22%",
        radius: "190px",
        duration1: "4.6s",
        duration2: "2.3s",
        color1: "rgba(96, 165, 250, 0.55)",
        color2: "rgba(37, 99, 235, 0.18)",
      },
      {
        x: "74%",
        y: "64%",
        radius: "160px",
        duration1: "5.2s",
        duration2: "1.9s",
        color1: "rgba(52, 211, 153, 0.42)",
        color2: "rgba(16, 185, 129, 0.12)",
      },
    ],
  },
  {
    id: "vitrine",
    code: "II · 02",
    eyebrow: "Capítulo 02 · Showroom",
    title: "Luz de Showroom & Margem",
    subtitle:
      "Preço pedido, custo de preparação e margem projetada lado a lado antes de qualquer negociação.",
    metaLeft: "VITRINE · PRECIFICAÇÃO REAL",
    metaRight: "Z -6.5m · 38mm",
    imageSrc: "/landing/web/garagem-2.webp",
    glows: [
      {
        x: "52%",
        y: "26%",
        radius: "180px",
        duration1: "4.2s",
        duration2: "2.1s",
        color1: "rgba(147, 197, 253, 0.55)",
        color2: "rgba(59, 130, 246, 0.16)",
      },
      {
        x: "34%",
        y: "72%",
        radius: "145px",
        duration1: "5.0s",
        duration2: "1.7s",
        color1: "rgba(251, 191, 36, 0.38)",
        color2: "rgba(245, 158, 11, 0.10)",
        flame: true,
      },
    ],
  },
  {
    id: "telemetria",
    code: "III · 03",
    eyebrow: "Capítulo 03 · Giro",
    title: "Pulso de 6.000 RPM",
    subtitle:
      "O relógio de dias parados funciona como um conta-giros de capital: quando passa de 45 dias, o alerta acende.",
    metaLeft: "TELEMETRIA · DIAS EM ESTOQUE",
    metaRight: "Z -13.0m · 40mm",
    imageSrc: "/landing/web/painel-car.webp",
    glows: [
      {
        x: "50%",
        y: "46%",
        radius: "195px",
        duration1: "3.6s",
        duration2: "0.42s",
        color1: "rgba(251, 191, 36, 0.62)",
        color2: "rgba(239, 68, 68, 0.22)",
        flame: true,
      },
      {
        x: "76%",
        y: "38%",
        radius: "150px",
        duration1: "4.4s",
        duration2: "1.8s",
        color1: "rgba(96, 165, 250, 0.52)",
        color2: "rgba(37, 99, 235, 0.16)",
      },
    ],
  },
  {
    id: "cockpit",
    code: "IV · 04",
    eyebrow: "Capítulo 04 · Cockpit",
    title: "Decisão no Volante",
    subtitle:
      "Sem planilhas espalhadas: no celular ou no computador da loja, toda a operação cabe em três telas.",
    metaLeft: "COCKPIT · COMANDO DIRETO",
    metaRight: "Z -19.5m · 42mm",
    imageSrc: "/landing/web/carro-dentro.webp",
    glows: [
      {
        x: "42%",
        y: "54%",
        radius: "165px",
        duration1: "4.8s",
        duration2: "2.2s",
        color1: "rgba(96, 165, 250, 0.48)",
        color2: "rgba(37, 99, 235, 0.14)",
      },
    ],
  },
  {
    id: "movimento",
    code: "V · 05",
    eyebrow: "Capítulo 05 · Match",
    title: "Engenharia em Movimento",
    subtitle:
      "Quando entra o carro certo, o AutoGiro cruza com os compradores que já deixaram pedido e avisa na hora.",
    metaLeft: "CRUZAMENTO · LEADS ATIVOS",
    metaRight: "Z -26.0m · 40mm",
    imageSrc: "/landing/web/benjamin-zhao-5DremXTTKE0-unsplash.webp",
    glows: [
      {
        x: "58%",
        y: "56%",
        radius: "175px",
        duration1: "4.5s",
        duration2: "2.0s",
        color1: "rgba(56, 189, 248, 0.50)",
        color2: "rgba(37, 99, 235, 0.15)",
      },
    ],
  },
  {
    id: "estrada",
    code: "VI · 06",
    eyebrow: "Capítulo 06 · Estrada",
    title: "A Estrada Aberta",
    subtitle:
      "Carro vendido rápido, capital livre para a próxima compra e histórico limpo para repetir o ciclo.",
    metaLeft: "HORIZONTE · LIQUIDEZ REAL",
    metaRight: "Z -32.5m · 36mm",
    imageSrc: "/landing/web/estrada.webp",
    glows: [
      {
        x: "50%",
        y: "35%",
        radius: "200px",
        duration1: "5.2s",
        duration2: "2.4s",
        color1: "rgba(52, 211, 153, 0.48)",
        color2: "rgba(37, 99, 235, 0.16)",
      },
    ],
  },
];


/** Mosaico de placas WebGL (cloth + glow do MengTo/kage) flutuando sobre o palco 3D fixo (`KageScrollStage`). */
export function KageScrollGallery() {
  return (
    <section id="travessia-3d" data-cam="1" aria-labelledby="travessia-titulo" className="relative py-(--section-gap-l)">
      <div className="mx-auto w-full max-w-(--container) px-(--gutter)">
        <div>
          <div className="mb-10 grid gap-4 border-b border-rule pb-8 lg:grid-cols-12 lg:items-end lg:gap-(--gap-columns)">
            <div className="grid gap-3 lg:col-span-7">
              <p className="text-sm font-medium text-brand">Travessia · Do pátio à estrada</p>
              <h2 id="travessia-titulo" className="font-semibold uppercase">
                Seis paradas do giro de um carro
              </h2>
            </div>
            <p className="lead text-ink-2 lg:col-span-5">
              Do dia em que entra no pátio ao dia em que sai vendido.
            </p>
          </div>

          {/* Layout B-Mosaic de Kage: 1 card vertical duplo à esquerda + 2 empilhados à direita */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 lg:row-span-2">
              <KageClothCard
                featured
                imageSrc={GALLERY_CHAPTERS[0].imageSrc}
                eyebrow={GALLERY_CHAPTERS[0].eyebrow}
                code={GALLERY_CHAPTERS[0].code}
                title={GALLERY_CHAPTERS[0].title}
                subtitle={GALLERY_CHAPTERS[0].subtitle}
                metaLeft={GALLERY_CHAPTERS[0].metaLeft}
                metaRight={GALLERY_CHAPTERS[0].metaRight}
                glows={GALLERY_CHAPTERS[0].glows}
              />
            </div>

            <div className="lg:col-span-5">
              <KageClothCard
                aspectClass="aspect-[16/10]"
                imageSrc={GALLERY_CHAPTERS[1].imageSrc}
                eyebrow={GALLERY_CHAPTERS[1].eyebrow}
                code={GALLERY_CHAPTERS[1].code}
                title={GALLERY_CHAPTERS[1].title}
                subtitle={GALLERY_CHAPTERS[1].subtitle}
                metaLeft={GALLERY_CHAPTERS[1].metaLeft}
                metaRight={GALLERY_CHAPTERS[1].metaRight}
                glows={GALLERY_CHAPTERS[1].glows}
              />
            </div>

            <div className="lg:col-span-5">
              <KageClothCard
                aspectClass="aspect-[16/10]"
                imageSrc={GALLERY_CHAPTERS[2].imageSrc}
                eyebrow={GALLERY_CHAPTERS[2].eyebrow}
                code={GALLERY_CHAPTERS[2].code}
                title={GALLERY_CHAPTERS[2].title}
                subtitle={GALLERY_CHAPTERS[2].subtitle}
                metaLeft={GALLERY_CHAPTERS[2].metaLeft}
                metaRight={GALLERY_CHAPTERS[2].metaRight}
                glows={GALLERY_CHAPTERS[2].glows}
              />
            </div>
          </div>

          {/* Segunda fileira: Cockpit, Movimento e Estrada */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {GALLERY_CHAPTERS.slice(3, 6).map((ch) => (
                <KageClothCard
                  key={ch.id}
                  aspectClass="aspect-[16/11]"
                  imageSrc={ch.imageSrc}
                  eyebrow={ch.eyebrow}
                  code={ch.code}
                  title={ch.title}
                  subtitle={ch.subtitle}
                  metaLeft={ch.metaLeft}
                  metaRight={ch.metaRight}
                  glows={ch.glows}
                />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
