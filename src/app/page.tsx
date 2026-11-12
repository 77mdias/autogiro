import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calculator, Car, Check, MessageCircle, ShieldCheck, Smartphone, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { Reveal } from "@/components/landing/reveal";
import { FAIXAS, MAX_VENDEDORES, TRIAL_DIAS } from "@/lib/plano";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "AutoGiro: seus carros na internet, com WhatsApp e simulação de financiamento" },
  description: "Cadastre os carros pelo celular, mande o link da vitrine e receba pedidos de financiamento com a CNH do cliente.",
};

const A_PARTIR = `a partir de R$ ${FAIXAS[0].reais}`;
const CTA = `Testar ${TRIAL_DIAS} dias grátis`;

const PASSOS = [
  {
    titulo: "Cadastre seus carros",
    texto: "Tire as fotos no pátio e preencha preço e quilometragem. Tudo pelo celular.",
    tela: "/landing/cadastro.png",
    alt: "Tela de cadastro de carro, com fotos, marca, modelo e preço",
  },
  {
    titulo: "Mande o link da vitrine",
    texto: "Seu estoque inteiro numa página só. Mande no WhatsApp, no Instagram ou onde quiser.",
    tela: "/landing/estoque.png",
    alt: "Tela de estoque, com o botão Copiar link da vitrine",
  },
  {
    titulo: "Receba os interessados",
    texto: "O cliente chama no seu WhatsApp ou pede a simulação de financiamento com a CNH.",
    tela: "/landing/interessados.png",
    alt: "Tela de interessados, com uma simulação, o botão Ver CNH e o botão do WhatsApp",
  },
];

const FUNCOES = [
  { icone: Car, titulo: "Cadastro rápido", texto: "Até 15 fotos por carro, com preço, ano e quilometragem." },
  { icone: Store, titulo: "Vitrine com link próprio", texto: "O cliente vê todos os seus carros e busca por marca, modelo e ano." },
  { icone: MessageCircle, titulo: "Contato pelo WhatsApp", texto: "Um botão no anúncio abre a conversa com você, já dizendo qual carro interessou." },
  { icone: Calculator, titulo: "Simulação de financiamento", texto: "O cliente escolhe a entrada e as parcelas (de 12x a 60x) e manda a CNH." },
  { icone: ShieldCheck, titulo: "CNH guardada com segurança", texto: "Só a sua loja vê o documento, e ele é apagado sozinho em 90 dias (LGPD)." },
  { icone: Smartphone, titulo: "Sem instalar nada", texto: "Funciona no navegador do celular e do computador. O cliente não precisa criar conta." },
];

const VANTAGENS = [
  ["Mandar fotos soltas para cada cliente", "Mandar um link só, com o estoque inteiro"],
  ["Pedir entrada, prazo e CNH no meio da conversa", "Receber o pedido pronto, com a CNH anexada"],
  ["Guardar documento de cliente na galeria do celular", "Documento guardado com segurança e apagado sozinho"],
  ["Pagar portal por anúncio ou por contato", `Mensalidade fixa, ${A_PARTIR}, com carros ilimitados`],
];

const PERGUNTAS = [
  ["Preciso instalar um aplicativo?", "Não. O AutoGiro abre no navegador do celular ou do computador. Se quiser, dá para colocar um atalho na tela inicial, como um aplicativo."],
  ["O cliente precisa criar conta?", "Não. Ele abre o link, vê os carros e pede a simulação. Só você entra no painel, com a conta Google ou o e-mail da loja."],
  ["Preciso de cartão para testar?", `Não. São ${TRIAL_DIAS} dias grátis sem cartão. Depois, a mensalidade da sua faixa, ${A_PARTIR} por mês.`],
  [
    "Meus vendedores podem usar?",
    `Sim, até ${MAX_VENDEDORES}. Cada um entra com a própria conta, cadastra carros e cuida dos clientes dele; editar ou excluir passa pela sua aprovação. A mensalidade muda conforme o número de vendedores.`,
  ],
  ["Quantos carros posso cadastrar?", "Quantos quiser. O plano não tem limite de carros nem de simulações."],
  ["Marcar como vendido apaga o anúncio?", "Não. O carro continua na vitrine com o selo Vendido, mostrando que sua loja vende."],
];

function Secao({ id, titulo, children, className }: { id: string; titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`py-(--section-gap-s) ${className ?? ""}`}>
      <div className="mx-auto grid w-full max-w-(--container) gap-(--space-xl) px-(--gutter)">
        <h2 id={id} className="font-semibold">
          {titulo}
        </h2>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh text-ink">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-18 w-full max-w-(--container) items-center justify-between px-(--gutter)">
          <Link href="/" aria-label="AutoGiro, página inicial" className="rounded-card">
            <Wordmark className="text-xl" />
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>
            Entrar
          </Link>
        </div>
      </header>

      <main>
        <section className="py-(--section-gap-s)">
          <div className="mx-auto grid w-full max-w-(--container) gap-6 px-(--gutter)">
            <p className="lp-in text-lg font-medium text-brand" style={{ "--i": 0 } as React.CSSProperties}>
              Para lojas de carros seminovos
            </p>
            <h1 className="lp-in font-semibold" style={{ "--i": 1 } as React.CSSProperties}>
              Seus carros na internet, com um link só.
            </h1>
            <p className="lp-in lead text-ink-2" style={{ "--i": 2 } as React.CSSProperties}>
              Cadastre os carros pelo celular, mande o link para os clientes e receba pedidos de financiamento com a CNH.
            </p>
            <div className="lp-in grid justify-items-start gap-5 pt-2" style={{ "--i": 3 } as React.CSSProperties}>
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                {CTA}
              </Link>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-lg text-ink-2">
                {["Sem cartão", "Carros ilimitados", `Depois, ${A_PARTIR}/mês`].map((item) => (
                  <li key={item} className="inline-flex items-center gap-2">
                    <Check className="size-5 text-signal" aria-hidden /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <Secao id="como-funciona" titulo="Como funciona" className="bg-paper-2">
          <Reveal as="ol" className="grid gap-(--space-xl) md:grid-cols-3 md:gap-(--gap-columns)">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} data-reveal style={{ "--i": i } as React.CSSProperties} className="grid content-start gap-4">
                <span className="grid size-12 place-items-center rounded-full bg-brand font-display text-xl font-semibold text-brand-ink" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="text-2xl font-semibold">{p.titulo}</h3>
                <p className="text-lg text-ink-2">{p.texto}</p>
                <div className="aspect-[3/4] max-w-xs overflow-hidden rounded-2xl border border-rule bg-paper">
                  <Image src={p.tela} alt={p.alt} width={780} height={1688} sizes="(min-width: 48rem) 20rem, 90vw" className="size-full object-cover object-top" />
                </div>
              </li>
            ))}
          </Reveal>
        </Secao>

        <Secao id="funcoes" titulo="O que o AutoGiro faz pela sua loja">
          <Reveal as="ul" className="grid gap-x-(--gap-columns) gap-y-(--space-xl) sm:grid-cols-2 lg:grid-cols-3">
            {FUNCOES.map((f, i) => (
              <li key={f.titulo} data-reveal style={{ "--i": Math.min(i, 4) } as React.CSSProperties} className="grid content-start gap-3">
                <f.icone className="size-8 text-brand" strokeWidth={1.75} aria-hidden />
                <h3 className="text-2xl font-semibold">{f.titulo}</h3>
                <p className="text-lg text-ink-2">{f.texto}</p>
              </li>
            ))}
          </Reveal>
        </Secao>

        <Secao id="por-que" titulo="Por que usar" className="bg-paper-2">
          <ul className="grid gap-4">
            {VANTAGENS.map(([antes, depois]) => (
              <li key={antes} className="grid gap-2 rounded-card border border-rule bg-paper p-6 md:grid-cols-2 md:gap-(--gap-columns)">
                <p className="text-lg text-ink-3">
                  <span className="font-medium text-ink-2">Antes: </span>
                  {antes}
                </p>
                <p className="inline-flex items-start gap-2 text-lg font-medium text-ink">
                  <Check className="mt-1 size-5 shrink-0 text-signal" aria-hidden />
                  <span>
                    <span className="visually-hidden">Com o AutoGiro: </span>
                    {depois}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao id="preco" titulo="Quanto custa">
          <div className="grid max-w-xl gap-6 rounded-card border border-rule-2 p-8">
            <table className="w-full border-collapse text-left text-lg">
              <caption className="pb-2 text-left text-ink-2">Mensalidade pelo número de vendedores (você, o dono, não conta)</caption>
              <tbody>
                {FAIXAS.map((f) => (
                  <tr key={f.rotulo} className="border-b border-rule">
                    <th scope="row" className="py-3 pr-4 font-normal">
                      {f.ate === 0 ? "Só você" : f.rotulo}
                    </th>
                    <td className="num py-3 text-right font-display text-2xl font-semibold whitespace-nowrap">
                      R$ {f.reais}
                      <span className="text-base font-normal text-ink-3"> /mês</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="grid gap-3 text-lg">
              {[`${TRIAL_DIAS} dias grátis para testar, sem cartão`, "Carros e simulações sem limite", "Vitrine, WhatsApp e simulação inclusos"].map((item) => (
                <li key={item} className="inline-flex items-start gap-2">
                  <Check className="mt-1 size-5 shrink-0 text-signal" aria-hidden /> {item}
                </li>
              ))}
            </ul>
            <Link href="/login" className={buttonVariants({ size: "lg", className: "justify-self-start" })}>
              {CTA}
            </Link>
          </div>
        </Secao>

        <Secao id="perguntas" titulo="Perguntas frequentes" className="bg-paper-2">
          <div className="max-w-3xl border-t border-rule">
            {PERGUNTAS.map(([pergunta, resposta]) => (
              <details key={pergunta} className="group border-b border-rule">
                <summary className="flex min-h-18 cursor-pointer list-none items-center justify-between gap-4 py-5 text-title font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
                  {pergunta}
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-rule-2 text-xl text-ink-2 transition-transform duration-(--dur-short) group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[60ch] pb-6 text-lg text-ink-2">{resposta}</p>
              </details>
            ))}
          </div>
        </Secao>

        <section aria-labelledby="fim-titulo" className="py-(--section-gap-s)">
          <div className="mx-auto grid w-full max-w-(--container) justify-items-start gap-5 px-(--gutter)">
            <h2 id="fim-titulo" className="font-semibold">
              Coloque sua loja na internet hoje
            </h2>
            <p className="lead text-ink-2">Só precisa do nome da loja e do seu WhatsApp.</p>
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              {CTA}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto grid w-full max-w-(--container) gap-6 px-(--gutter) py-(--space-2xl)">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" aria-label="AutoGiro, página inicial" className="rounded-card">
              <Wordmark />
            </Link>
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/privacidade" className="text-ink-2 underline hover:text-ink">
                Política de privacidade
              </Link>
              <Link href="/login" className="text-lg text-ink-2 underline hover:text-ink">
                Entrar no painel
              </Link>
            </div>
          </div>
          <p className="text-sm text-ink-3">
            Fotos dos carros de exemplo nas telas:{" "}
            <a className="underline" href="https://commons.wikimedia.org/wiki/File:Chevrolet_Onix_Mk2_RS_2020_in_Maldonado_-_front.jpg">NaBUru38</a>,{" "}
            <a className="underline" href="https://commons.wikimedia.org/wiki/File:2021_Toyota_Corolla_LE,_front_right,_07-13-2024.jpg">MercurySable99</a>,{" "}
            <a className="underline" href="https://commons.wikimedia.org/wiki/File:HB20X_2nd_Generation_Frontal_View_(cropped).jpg">Nave do Conhecimento</a> e{" "}
            <a className="underline" href="https://commons.wikimedia.org/wiki/File:Volkswagen_T-Cross_1X7A0363.jpg">Alexander Migl</a> (CC BY-SA 4.0, Wikimedia Commons).
          </p>
        </div>
      </footer>
    </div>
  );
}
