import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, Calculator, Car, Check, LayoutList, MessageCircle, ShieldCheck, Store, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { KageScrollStage } from "@/components/landing/kage-scroll-stage";
import { PinnedRun } from "@/components/landing/pinned-run";
import { ThreeFeatureCards } from "@/components/landing/three-feature-cards";
import { KageScrollGallery } from "@/components/landing/kage-scroll-gallery";
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

const COMPARATIVO = [
  [
    "Envio do estoque",
    "Mandar 15 fotos soltas no WhatsApp para cada curioso",
    "1 link único da vitrine com busca por marca, modelo e ano",
  ],
  [
    "Qualificação de ficha",
    "Cobrar entrada, prazo e foto da CNH no meio da conversa",
    "O pedido já chega com entrada, parcelas (12x a 60x) e CNH anexada",
  ],
  [
    "Segurança LGPD",
    "Documentos de clientes salvos na galeria do celular da loja",
    "Cofre privado com link assinado de 5 minutos e exclusão aos 90 dias",
  ],
  [
    "Custo previsível",
    "Portais que cobram por pacote de anúncios ou taxa por lead",
    "R$ 149/mês fixos, carros ilimitados e 7 dias grátis para testar",
  ],
];

const CNH = [
  ["Envio", "O cliente aceita a LGPD e anexa foto ou PDF", "Na simulação"],
  ["Guarda", "Arquivo numa pasta sem acesso público", "Até 90 dias"],
  ["Consulta", "Link assinado, aberto só para a sua loja", "Vale 5 minutos"],
  ["Exclusão", "Arquivo e registro apagados sozinhos", "Aos 90 dias"],
];

const PERGUNTAS = [
  ["Preciso instalar um app?", "Não. O AutoGiro abre no navegador do computador ou celular e pode ser fixado na tela inicial como um aplicativo."],
  ["O cliente precisa criar conta?", "Não. Vitrine e simulação são abertas; só você entra, com a conta Google ou e-mail da loja."],
  ["Quantas fotos cabem por carro?", "Até 15 fotos por veículo, redimensionadas automaticamente antes do envio. A primeira vira a capa na vitrine."],
  ["Marcar como vendido apaga o anúncio?", "Não. O carro continua na vitrine com o selo Vendido para mostrar giro de pátio, sem o botão de simular."],
  ["Quanto custa depois dos 7 dias grátis?", "Plano único de R$ 149 por mês, sem limite de carros cadastrados nem de simulações recebidas."],
];

export default function Home() {
  return (
    <div className="theme-night lp-kage relative min-h-dvh text-ink">
      <KageScrollStage />
      <a
        href="#conteudo"
        className="absolute -top-24 left-4 z-(--z-toast) rounded-full bg-ink px-4 py-2 text-paper focus-visible:top-4"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-(--z-sticky-nav) bg-night/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-(--container) items-center justify-between px-(--gutter) lg:h-20">
          <Link href="/" aria-label="AutoGiro, página inicial" className="rounded-card">
            <Wordmark tone="night" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href="#caminho"
              className="hidden rounded-card text-sm font-medium text-ink-2 transition-colors duration-(--dur-micro) hover:text-ink md:inline-block"
            >
              Como funciona
            </a>
            <a
              href="#vantagens"
              className="hidden rounded-card text-sm font-medium text-ink-2 transition-colors duration-(--dur-micro) hover:text-ink md:inline-block"
            >
              Vantagens 3D
            </a>
            <a
              href="#painel-demo"
              className="hidden rounded-card text-sm font-medium text-ink-2 transition-colors duration-(--dur-micro) hover:text-ink lg:inline-block"
            >
              Painel
            </a>
            <Link href="/login" className={buttonVariants({ variant: "outline", className: "h-11 px-5 pointer-fine:h-11" })}>
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main id="conteudo" className="relative z-10">
        {/* Primeira tela: o palco 3D fixo (KageScrollStage) é o fundo, com o carro no centro.
            Texto no topo e números no rodapé (composição do Kage) deixam o meio livre para o carro. */}
        <section data-cam="0" className="relative min-h-[calc(100svh-4rem)] lg:min-h-[calc(100svh-5rem)]">
          <div className="mx-auto flex min-h-[inherit] w-full max-w-(--container) flex-col justify-between gap-10 px-(--gutter) pt-8 pb-10 lg:pt-14 lg:pb-12">
            <div className="grid content-start gap-6 lg:max-w-[46rem]">
              <p data-hero-exit="0" className="inline-flex justify-self-start rounded-full border border-rule-2 bg-night/50 px-3.5 py-1 text-xs font-medium text-ink-2 backdrop-blur-sm">
                Plataforma para lojas de seminovos · 7 dias grátis
              </p>
              <h1 data-hero-exit="1" className="text-display font-semibold uppercase">
                Seu pátio
                <br />
                cabe num link.
              </h1>
              <p data-hero-exit="2" className="lead max-w-[34ch] text-ink-2">
                Cadastre pelo celular, mande a vitrine, receba simulações com CNH.
              </p>
              <div data-hero-exit="3" className="flex flex-wrap gap-3">
                <Link href="/login" className={buttonVariants({ className: "pointer-fine:h-12 pointer-fine:px-6" })}>
                  Criar minha vitrine
                </Link>
                <a href="#caminho" className={buttonVariants({ variant: "outline", className: "pointer-fine:h-12 pointer-fine:px-6" })}>
                  <ArrowDown aria-hidden /> Ver o caminho do cliente
                </a>
              </div>
            </div>
            <dl
              aria-hidden="true"
              data-hero-exit="4"
              className="grid grid-cols-3 gap-4 border-t border-rule pt-5 sm:max-w-lg"
            >
              <div>
                <dt className="text-xs text-ink-3">Por veículo</dt>
                <dd className="num font-display text-xl font-semibold text-ink">Até 15 fotos</dd>
              </div>
              <div className="border-l border-rule pl-4">
                <dt className="text-xs text-ink-3">Chave da CNH</dt>
                <dd className="num font-display text-xl font-semibold text-signal">Vale 5 min</dd>
              </div>
              <div className="border-l border-rule pl-4">
                <dt className="text-xs text-ink-3">Plano fixo</dt>
                <dd className="num font-display text-xl font-semibold text-ink">R$ 149/mês</dd>
              </div>
            </dl>
          </div>
        </section>

        <KageScrollGallery />

        {/* Mapa do fluxo do comprador */}
        <section id="caminho" data-cam="2" aria-labelledby="caminho-titulo" className="py-(--section-gap-l)">
          <div className="mx-auto grid w-full max-w-(--container) gap-(--space-2xl) px-(--gutter)">
            <div className="grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-(--gap-columns)">
              <h2 id="caminho-titulo" className="font-semibold lg:col-span-6">
                O caminho de um cliente
              </h2>
              <p className="lead text-ink-2 lg:col-span-5 lg:col-start-8">
                Do anúncio até a conversa no seu WhatsApp, sem você digitar nada.
              </p>
            </div>

            <div className="relative">
              <svg
                aria-hidden="true"
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
                    className={`ticks grid content-start gap-3 bg-paper-2/70 p-6 backdrop-blur-md lg:min-h-44 ${p.lugar}`}
                  >
                    <p.icone className={p.sinal ? "size-5 text-signal" : "size-5 text-brand"} strokeWidth={1.75} aria-hidden />
                    <h3 className="text-title font-semibold">{p.titulo}</h3>
                    <p className="text-ink-2">{p.texto}</p>
                  </li>
                ))}
              </Reveal>
            </div>
          </div>
        </section>

        {/* Seção de Cards Visuais Animados em Three.js + Dados & Vantagens */}
        <section id="vantagens" data-cam="3" aria-labelledby="vantagens-titulo" className="lp-scrim py-(--section-gap-l)">
          <div className="mx-auto grid w-full max-w-(--container) gap-(--space-2xl) px-(--gutter)">
            <div className="grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-(--gap-columns)">
              <div className="grid gap-3 lg:col-span-7">
                <p className="text-sm font-medium text-brand">Engenharia de pátio · Dados e vantagens</p>
                <h2 id="vantagens-titulo" className="font-semibold">
                  Menos conversa perdida, mais ficha pronta para aprovar
                </h2>
              </div>
              <p className="lead text-ink-2 lg:col-span-5">
                Três motores que tiram o trabalho braçal do vendedor e entregam o comprador qualificado.
              </p>
            </div>

            <ThreeFeatureCards />

            {/* Comparativo direto: antes e depois na rotina da loja */}
            <div className="pt-6">
              <table className="w-full border-collapse text-left">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-rule-2 text-sm text-ink-3">
                    <th scope="col" className="py-4 pr-6 font-medium">Rotina no pátio</th>
                    <th scope="col" className="py-4 pr-6 font-medium">No improviso (sem vitrine)</th>
                    <th scope="col" className="py-4 font-medium text-signal">Com o AutoGiro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule md:divide-y-0">
                  {COMPARATIVO.map(([etapa, antes, depois]) => (
                    <tr key={etapa} className="grid gap-2 border-b border-rule py-5 md:table-row md:py-0">
                      <th scope="row" className="block font-display text-lg font-semibold text-ink md:table-cell md:py-6 md:pr-6 md:align-top">
                        {etapa}
                      </th>
                      <td className="block text-sm text-ink-3 md:table-cell md:py-6 md:pr-6 md:align-top md:text-base">
                        <span className="mr-1.5 font-medium text-ink-2 md:hidden">Sem vitrine:</span>
                        {antes}
                      </td>
                      <td className="block font-medium text-ink md:table-cell md:py-6 md:align-top">
                        <span className="inline-flex items-start gap-2">
                          <Check className="mt-1 size-4 shrink-0 text-signal" aria-hidden />
                          <span>{depois}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Seção interativa adaptativa ao dispositivo (Desktop vê Desktop, Mobile vê Mobile) */}
        <section id="painel-demo" data-cam="4" aria-labelledby="painel-titulo" className="py-(--section-gap-l)">
          <div className="mx-auto grid w-full max-w-(--container) gap-(--space-2xl) px-(--gutter)">
            <div className="grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-(--gap-columns)">
              <div className="grid gap-3 lg:col-span-7">
                <p className="text-sm font-medium text-brand">Interativo · Adapta ao seu dispositivo</p>
                <h2 id="painel-titulo" className="font-semibold">
                  O painel cabe no bolso
                </h2>
              </div>
              <p className="lead text-ink-2 lg:col-span-5">
                No computador da loja você opera em tela cheia; no celular do pátio, tudo fica ao alcance do polegar. Clique nas abas abaixo para testar.
              </p>
            </div>
            <PinnedRun
              paineis={[
                {
                  titulo: "Cadastro de um toque",
                  texto: "Fotos da galeria, preço e quilometragem. Câmbio e combustível num toque.",
                  tela: "/landing/cadastro.png",
                  alt: "Tela de cadastro de carro, com fotos, marca, modelo e preço",
                },
                {
                  titulo: "O estoque na palma da mão",
                  texto: "Busque, separe os vendidos e copie o link da vitrine.",
                  tela: "/landing/estoque.png",
                  alt: "Tela de estoque, com cartões de carros, preços e filtros",
                },
                {
                  titulo: "Quem simulou, com CNH",
                  texto: "Entrada, parcelas e o WhatsApp do cliente no mesmo cartão.",
                  tela: "/landing/interessados.png",
                  alt: "Tela de interessados, com uma simulação, o botão Ver CNH e o botão do WhatsApp",
                },
              ]}
            />
          </div>
        </section>

        {/* Segurança LGPD e ciclo da CNH */}
        <section id="cnh" aria-labelledby="cnh-titulo" className="lp-scrim py-(--section-gap-l)">
          <div className="mx-auto grid w-full max-w-(--container) gap-(--space-2xl) px-(--gutter) lg:grid-cols-12 lg:gap-x-(--gap-columns) lg:gap-y-(--space-2xl)">
            <div className="grid content-start gap-4 lg:col-span-6">
              <p className="text-sm font-medium text-signal">Conformidade LGPD de ponta a ponta</p>
              <h2 id="cnh-titulo" className="font-semibold">
                A CNH do cliente fica trancada
              </h2>
              <p className="lead text-ink-2">
                Nenhum documento fica exposto em link público. O acesso exige sessão ativa da loja e expira em 5 minutos.
              </p>
            </div>
            <figure className="ticks m-0 grid justify-items-start gap-2 bg-paper/70 p-6 backdrop-blur-md lg:col-span-5 lg:col-start-8">
              <div className="flex items-center gap-2 text-xs font-medium text-signal">
                <ShieldCheck className="size-4" aria-hidden />
                <span>Chave assinada temporária</span>
              </div>
              <p className="num font-display text-display-s font-semibold">
                5<span className="u">&nbsp;min</span>
              </p>
              <figcaption className="text-sm text-ink-3">é quanto vale o link para ver uma CNH</figcaption>
            </figure>

            <div className="lg:col-span-12">
              <table className="w-full border-collapse text-left">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-rule-2 text-sm text-ink-3">
                    <th scope="col" className="py-4 pr-6 font-medium">Etapa</th>
                    <th scope="col" className="py-4 pr-6 font-medium">O que acontece</th>
                    <th scope="col" className="py-4 font-medium whitespace-nowrap">Quando</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule md:divide-y-0">
                  {CNH.map(([etapa, oque, quando]) => (
                    <tr key={etapa} className="grid gap-1.5 border-b border-rule py-5 md:table-row md:py-0">
                      <th scope="row" className="block font-display text-xl font-semibold md:table-cell md:py-7 md:pr-6 md:align-top">{etapa}</th>
                      <td className="block text-base text-ink-2 md:table-cell md:py-7 md:pr-6 md:align-top md:text-lg">{oque}</td>
                      <td className="num block text-sm font-medium text-ink-3 md:table-cell md:py-7 md:align-top md:text-lg md:font-normal md:text-ink md:whitespace-nowrap">{quando}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="perguntas-titulo" className="py-(--section-gap-l)">
          <div className="mx-auto grid w-full max-w-(--container) gap-(--space-2xl) px-(--gutter) lg:grid-cols-12 lg:gap-(--gap-columns)">
            <div className="grid content-start gap-4 lg:col-span-4">
              <h2 id="perguntas-titulo" className="font-semibold">
                Perguntas de quem vende carro
              </h2>
              <p className="text-ink-2">
                Tudo incluso no plano único de R$ 149/mês após os 7 dias de teste grátis.
              </p>
            </div>
            <div className="border-t border-rule lg:col-span-7 lg:col-start-6">
              {PERGUNTAS.map(([pergunta, resposta]) => (
                <details key={pergunta} className="group border-b border-rule">
                  <summary className="flex min-h-22 cursor-pointer list-none items-center justify-between gap-4 py-6 text-title font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
                    {pergunta}
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-full border border-rule-2 text-ink-2 transition-transform duration-(--dur-short) group-open:rotate-45 motion-reduce:transition-none"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[60ch] pb-8 text-ink-2">{resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Fechamento / CTA */}
        <section data-cam="5" aria-labelledby="fim-titulo" className="py-(--section-gap-l)">
          <div className="mx-auto grid w-full max-w-(--container) gap-6 px-(--gutter) lg:grid-cols-12 lg:items-center lg:gap-(--gap-columns)">
            <div className="grid gap-3 lg:col-span-7">
              <h2 id="fim-titulo" className="font-semibold">
                Sua vitrine no ar ainda hoje
              </h2>
              <p className="lead text-ink-2">
                7 dias grátis sem precisar de cartão. Depois, R$ 149/mês com estoque e simulações ilimitados.
              </p>
            </div>
            <div className="grid justify-items-start gap-3 lg:col-span-4 lg:col-start-9 lg:justify-items-end">
              <Link href="/login" className={buttonVariants({ className: "pointer-fine:h-12 pointer-fine:px-6" })}>
                Criar minha vitrine
              </Link>
              <p className="text-sm text-ink-3">Só o nome da loja e o WhatsApp.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-rule">
        <div className="mx-auto grid w-full max-w-(--container) gap-10 px-(--gutter) py-(--space-3xl) lg:grid-cols-12 lg:gap-(--gap-columns)">
          <div className="grid content-start gap-4 lg:col-span-6">
            <Link href="/" aria-label="AutoGiro, página inicial" className="self-start rounded-card">
              <Wordmark tone="night" className="text-xl" />
            </Link>
            <p className="font-display text-2xl font-semibold">Feito para quem vende carro no pátio.</p>
            <p className="text-ink-3">Equipe AutoGiro, novembro de 2026</p>
          </div>
          <nav aria-label="Rodapé" className="lg:col-span-3 lg:col-start-8">
            <ul className="grid gap-3">
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
              <li>
                <a href="#vantagens" className="text-ink-2 hover:text-ink">
                  Vantagens 3D
                </a>
              </li>
              <li>
                <a href="#painel-demo" className="text-ink-2 hover:text-ink">
                  Painel interativo
                </a>
              </li>
            </ul>
          </nav>
          <div className="grid gap-4 border-t border-rule pt-6 text-sm text-ink-3 lg:col-span-12">
            <p data-credits className="max-w-[90ch]">
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
