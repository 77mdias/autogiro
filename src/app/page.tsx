import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, Calculator, Car, LayoutList, MessageCircle, Store, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { PointCar } from "@/components/landing/point-car";
import { PinnedRun } from "@/components/landing/pinned-run";
import { Reveal } from "@/components/landing/reveal";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "AutoGiro: o estoque da sua loja numa vitrine com WhatsApp e simulação" },
  description: "Cadastre os carros pelo celular, mande o link da vitrine e receba simulações de financiamento com CNH.",
};

// Posições no mapa (5 colunas x 3 linhas no desktop); no celular é uma lista vertical
const PARADAS = [
  { icone: Car, titulo: "Você cadastra", texto: "Fotos, preço e km pelo celular, no pátio.", lugar: "lg:col-start-1 lg:row-start-2" },
  { icone: Store, titulo: "A vitrine vai ao ar", texto: "Um link só, com o estoque inteiro.", lugar: "lg:col-start-2 lg:row-start-2" },
  { icone: LayoutList, titulo: "O cliente abre o carro", texto: "Galeria, ficha e preço, sem criar conta.", lugar: "lg:col-start-3 lg:row-start-2" },
  { icone: MessageCircle, titulo: "Chama no WhatsApp", texto: "A mensagem chega com o carro e o link.", lugar: "lg:col-start-4 lg:row-start-1", sinal: true },
  { icone: Calculator, titulo: "Simula o financiamento", texto: "Entrada, parcelas e CNH, com aceite da LGPD.", lugar: "lg:col-start-4 lg:row-start-3" },
  { icone: Users, titulo: "Cai em Interessados", texto: "A CNH a um toque e o WhatsApp do cliente.", lugar: "lg:col-start-5 lg:row-start-3" },
];

const CNH = [
  ["Envio", "O cliente aceita a LGPD e anexa foto ou PDF", "Na simulação"],
  ["Guarda", "Arquivo numa pasta sem acesso público", "Até 90 dias"],
  ["Consulta", "Link assinado, aberto só para a sua loja", "Vale 5 minutos"],
  ["Exclusão", "Arquivo e registro apagados sozinhos", "Aos 90 dias"],
];

const PERGUNTAS = [
  ["Preciso instalar um app?", "Não. O AutoGiro abre no navegador e vai para a tela inicial do celular como um app."],
  ["O cliente precisa criar conta?", "Não. Vitrine e simulação são abertas; só você entra, com a conta Google."],
  ["Quantas fotos cabem por carro?", "Até 15. A primeira vira a capa na vitrine."],
  ["Marcar como vendido apaga o anúncio?", "Não. O carro fica na vitrine com a etiqueta Vendido e sem o botão de simular."],
];

export default function Home() {
  return (
    <div className="theme-night min-h-dvh bg-paper text-ink">
      <a
        href="#conteudo"
        className="absolute -top-24 left-4 z-(--z-toast) rounded-full bg-ink px-4 py-2 text-paper focus-visible:top-4"
      >
        Pular para o conteúdo
      </a>

      <header className="relative z-(--z-raised)">
        <div className="mx-auto flex h-16 w-full max-w-(--container) items-center justify-between px-(--gutter) lg:h-20">
          <Link href="/" aria-label="AutoGiro, página inicial" className="rounded-card">
            <Wordmark tone="night" />
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Entrar
          </Link>
        </div>
      </header>

      <main id="conteudo">
        {/* Primeira tela: o carro escaneado à direita, o texto no canto calmo à esquerda */}
        <section className="relative isolate overflow-x-clip lg:min-h-[calc(100svh-5rem)]">
          <div className="mx-auto grid w-full max-w-(--container) grid-cols-1 px-(--gutter) lg:min-h-[calc(100svh-5rem)] lg:grid-cols-12 lg:items-center">
            <div className="relative z-(--z-raised) grid gap-6 pt-6 lg:col-span-6 lg:pt-0 lg:pb-16">
              <h1 className="text-display font-light">
                Seu pátio
                <br />
                cabe num link.
              </h1>
              <p className="lead max-w-[30ch] text-ink-2">Cadastre pelo celular, mande a vitrine, receba simulações com CNH.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className={buttonVariants({ className: "pointer-fine:h-12 pointer-fine:px-6" })}>
                  Criar minha vitrine
                </Link>
                <a href="#caminho" className={buttonVariants({ variant: "outline", className: "pointer-fine:h-12 pointer-fine:px-6" })}>
                  <ArrowDown aria-hidden /> Ver o caminho do cliente
                </a>
              </div>
              <p className="text-sm text-ink-3">Você entra com a sua conta Google.</p>
            </div>
          </div>
          <PointCar className="relative m-0 h-[min(78vw,26rem)] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[62%]" />
        </section>

        <section id="caminho" aria-labelledby="caminho-titulo" className="py-(--section-gap)">
          <div className="mx-auto grid w-full max-w-(--container) gap-(--space-2xl) px-(--gutter)">
            <div className="grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-(--gap-columns)">
              <h2 id="caminho-titulo" className="font-light lg:col-span-6">
                O caminho de um cliente
              </h2>
              <p className="lead text-ink-2 lg:col-span-5 lg:col-start-8">
                Do anúncio até a conversa no seu WhatsApp, sem você digitar nada.
              </p>
            </div>

            <div className="relative">
              <svg
                aria-hidden
                className="lp-map absolute inset-0 hidden size-full lg:block"
                viewBox="0 0 500 300"
                preserveAspectRatio="none"
              >
                <path d="M50 150 H250" />
                <path d="M250 150 H300 V50 H350" className="is-signal" />
                <path d="M250 150 H300 V250 H450" />
              </svg>
              <Reveal as="ol" className="relative grid gap-3 lg:grid-cols-5 lg:grid-rows-3 lg:gap-x-(--gap-columns) lg:gap-y-10">
                {PARADAS.map((p, i) => (
                  <li
                    key={p.titulo}
                    data-reveal
                    style={{ "--i": Math.min(i, 4) } as React.CSSProperties}
                    className={`ticks grid content-start gap-3 bg-paper p-6 lg:min-h-44 ${p.lugar}`}
                  >
                    <p.icone className={p.sinal ? "size-5 text-signal" : "size-5 text-ink-3"} strokeWidth={1.5} aria-hidden />
                    <h3 className="text-title font-light">{p.titulo}</h3>
                    <p className="text-ink-2">{p.texto}</p>
                  </li>
                ))}
              </Reveal>
            </div>
          </div>
        </section>

        <section aria-labelledby="painel-titulo" className="border-t border-rule py-(--section-gap-l)">
          <div className="mx-auto grid w-full max-w-(--container) gap-(--space-2xl) px-(--gutter)">
            <h2 id="painel-titulo" className="font-light">
              O painel cabe no bolso
            </h2>
            <PinnedRun
              paineis={[
                {
                  titulo: "Cadastro de um toque",
                  texto: "Fotos da galeria, preço e quilometragem. Câmbio e combustível num toque.",
                  tela: "/landing/cadastro.png",
                  alt: "Tela de cadastro de carro no celular, com fotos, marca, modelo e preço",
                },
                {
                  titulo: "O estoque na palma da mão",
                  texto: "Busque, separe os vendidos e copie o link da vitrine.",
                  tela: "/landing/estoque.png",
                  alt: "Tela de estoque no celular, com cartões de carros, preços e filtros",
                },
                {
                  titulo: "Quem simulou, com CNH",
                  texto: "Entrada, parcelas e o WhatsApp do cliente no mesmo cartão.",
                  tela: "/landing/interessados.png",
                  alt: "Tela de interessados no celular, com uma simulação, o botão Ver CNH e o botão do WhatsApp",
                },
              ]}
            />
          </div>
        </section>

        <section aria-labelledby="cnh-titulo" className="bg-paper-2 py-(--section-gap-s)">
          <div className="mx-auto grid w-full max-w-(--container) gap-(--space-2xl) px-(--gutter) lg:grid-cols-12 lg:gap-(--gap-columns)">
            <div className="grid content-start gap-(--space-xl) lg:col-span-4">
              <h2 id="cnh-titulo" className="font-light">
                A CNH do cliente fica trancada
              </h2>
              <figure className="ticks m-0 grid justify-items-start gap-2 p-6">
                <p className="num font-display text-display-s font-extralight">
                  5<span className="u">&nbsp;min</span>
                </p>
                <figcaption className="text-sm text-ink-3">é quanto vale o link para ver uma CNH</figcaption>
              </figure>
            </div>
            <div className="-mx-(--gutter) overflow-x-auto px-(--gutter) lg:col-span-7 lg:col-start-6 lg:mx-0 lg:px-0">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule-2 text-sm text-ink-3">
                    <th scope="col" className="py-3 pr-4 font-normal">Etapa</th>
                    <th scope="col" className="py-3 pr-4 font-normal">O que acontece</th>
                    <th scope="col" className="py-3 font-normal whitespace-nowrap">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {CNH.map(([etapa, oque, quando]) => (
                    <tr key={etapa} className="border-b border-rule">
                      <th scope="row" className="py-5 pr-4 align-top text-lg font-normal">{etapa}</th>
                      <td className="py-5 pr-4 align-top text-ink-2">{oque}</td>
                      <td className="num py-5 align-top whitespace-nowrap">{quando}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section aria-labelledby="perguntas-titulo" className="py-(--section-gap)">
          <div className="mx-auto grid w-full max-w-(--container) gap-(--space-2xl) px-(--gutter) lg:grid-cols-12 lg:gap-(--gap-columns)">
            <h2 id="perguntas-titulo" className="font-light lg:col-span-4">
              Perguntas de quem vende carro
            </h2>
            <div className="border-t border-rule lg:col-span-7 lg:col-start-6">
              {PERGUNTAS.map(([pergunta, resposta]) => (
                <details key={pergunta} className="group border-b border-rule">
                  <summary className="flex min-h-18 cursor-pointer list-none items-center justify-between gap-4 py-5 text-title font-light outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
                    {pergunta}
                    <span
                      aria-hidden
                      className="grid size-9 shrink-0 place-items-center rounded-full border border-rule-2 text-ink-2 transition-transform duration-(--dur-short) group-open:rotate-45 motion-reduce:transition-none"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[60ch] pb-6 text-ink-2">{resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="fim-titulo" className="border-t border-rule bg-paper-2 py-(--section-gap-s)">
          <div className="mx-auto grid w-full max-w-(--container) gap-6 px-(--gutter) lg:grid-cols-12 lg:items-center lg:gap-(--gap-columns)">
            <h2 id="fim-titulo" className="font-light lg:col-span-7">
              Sua vitrine no ar ainda hoje
            </h2>
            <div className="grid justify-items-start gap-3 lg:col-span-4 lg:col-start-9 lg:justify-items-end">
              <Link href="/login" className={buttonVariants({ className: "pointer-fine:h-12 pointer-fine:px-6" })}>
                Criar minha vitrine
              </Link>
              <p className="text-sm text-ink-3">Só o nome da loja e o WhatsApp.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto grid w-full max-w-(--container) gap-10 px-(--gutter) py-(--space-3xl) lg:grid-cols-12 lg:gap-(--gap-columns)">
          <div className="grid content-start gap-3 lg:col-span-6">
            <p className="font-display text-2xl font-light">Feito para quem vende carro no pátio.</p>
            <p className="text-ink-3">Equipe AutoGiro, novembro de 2026</p>
          </div>
          <nav aria-label="Rodapé" className="lg:col-span-3 lg:col-start-8">
            <ul className="grid gap-2">
              <li>
                <Link href="/login" className="text-ink-2 hover:text-ink">
                  Entrar no painel
                </Link>
              </li>
              <li>
                <a href="#caminho" className="text-ink-2 hover:text-ink">
                  Como funciona
                </a>
              </li>
            </ul>
          </nav>
          <div className="grid gap-4 border-t border-rule pt-6 text-sm text-ink-3 lg:col-span-12">
            <Link href="/" aria-label="AutoGiro, página inicial" className="self-start rounded-card">
              <Wordmark tone="night" className="text-md" />
            </Link>
            <p className="max-w-[90ch]">
              Fotos dos carros de exemplo nas telas:{" "}
              <a className="underline" href="https://commons.wikimedia.org/wiki/File:Chevrolet_Onix_Mk2_RS_2020_in_Maldonado_-_front.jpg">NaBUru38</a>,{" "}
              <a className="underline" href="https://commons.wikimedia.org/wiki/File:2021_Toyota_Corolla_LE,_front_right,_07-13-2024.jpg">MercurySable99</a>,{" "}
              <a className="underline" href="https://commons.wikimedia.org/wiki/File:HB20X_2nd_Generation_Frontal_View_(cropped).jpg">Nave do Conhecimento</a> e{" "}
              <a className="underline" href="https://commons.wikimedia.org/wiki/File:Volkswagen_T-Cross_1X7A0363.jpg">Alexander Migl</a> (CC BY-SA 4.0, Wikimedia Commons).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
