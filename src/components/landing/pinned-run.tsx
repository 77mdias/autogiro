"use client";

import { useState } from "react";
import {
  Camera,
  Car,
  Check,
  Copy,
  ExternalLink,
  IdCard,
  Images,
  MessageCircle,
  Monitor,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Store,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";

type Painel = { titulo: string; texto: string; tela: string; alt: string };

const ESTOQUE_EXEMPLO = [
  {
    id: "corolla",
    marca: "Toyota",
    modelo: "Corolla",
    versao: "XEi 2.0 Direct Shift",
    ano: 2021,
    km: "42.000 km",
    cambio: "Automático",
    combustivel: "Flex",
    preco: "R$ 124.900",
    fotos: 8,
    status: "disponivel" as const,
    img: "/landing/cars/corolla.jpg",
  },
  {
    id: "onix",
    marca: "Chevrolet",
    modelo: "Onix RS",
    versao: "1.0 Turbo Automático",
    ano: 2020,
    km: "38.500 km",
    cambio: "Automático",
    combustivel: "Flex",
    preco: "R$ 78.900",
    fotos: 11,
    status: "disponivel" as const,
    img: "/landing/cars/onix.jpg",
  },
  {
    id: "tcross",
    marca: "Volkswagen",
    modelo: "T-Cross",
    versao: "Highline 250 TSI",
    ano: 2022,
    km: "29.100 km",
    cambio: "Automático",
    combustivel: "Flex",
    preco: "R$ 132.500",
    fotos: 15,
    status: "disponivel" as const,
    img: "/landing/cars/tcross.jpg",
  },
  {
    id: "hb20x",
    marca: "Hyundai",
    modelo: "HB20X",
    versao: "Diamond 1.6 Automático",
    ano: 2021,
    km: "51.200 km",
    cambio: "Automático",
    combustivel: "Flex",
    preco: "R$ 82.000",
    fotos: 6,
    status: "vendido" as const,
    img: "/landing/cars/hb20x.jpg",
  },
];

const LEADS_EXEMPLO = [
  {
    id: "lead-1",
    iniciais: "CE",
    nome: "Carlos Eduardo Rocha",
    tempo: "há 14 minutos",
    telefone: "(19) 99241-0812",
    carro: "Toyota Corolla 2021",
    preco: "R$ 124.900",
    entrada: "R$ 35.000",
    financiar: "R$ 89.900",
    parcelas: "48x",
    img: "/landing/cars/corolla.jpg",
    novo: true,
  },
  {
    id: "lead-2",
    iniciais: "MC",
    nome: "Mariana Costa",
    tempo: "há 38 minutos",
    telefone: "(19) 98812-4401",
    carro: "Chevrolet Onix RS 2020",
    preco: "R$ 78.900",
    entrada: "R$ 22.000",
    financiar: "R$ 56.900",
    parcelas: "36x",
    img: "/landing/cars/onix.jpg",
    novo: true,
  },
];

/**
 * Demonstração interativa e adaptativa ao dispositivo:
 * - No desktop (lg+): exibe a interface completa de computador (barra superior, grade de 3 colunas no estoque,
 *   formulário de 2 colunas no cadastro e cartões lado a lado em interessados).
 * - No celular (< lg) ou ao alternar para "Celular": exibe a interface mobile com barra inferior de abas.
 */
export function PinnedRun({ paineis }: { paineis: Painel[] }) {
  const [ativo, setAtivo] = useState(1); // Começa em Estoque (visão mais rica) ou permite alternar
  const [dispositivo, setDispositivo] = useState<"auto" | "desktop" | "mobile">("auto");
  const [filtroEstoque, setFiltroEstoque] = useState<"todos" | "disponivel" | "vendido">("todos");
  const [cambioDemo, setCambioDemo] = useState<"Automático" | "Manual">("Automático");
  const [combustivelDemo, setCombustivelDemo] = useState<"Flex" | "Gasolina" | "Híbrido">("Flex");
  const [cnhAberta, setCnhAberta] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const forcarMobile = dispositivo === "mobile";
  const carrosFiltrados = ESTOQUE_EXEMPLO.filter((c) =>
    filtroEstoque === "todos" ? true : c.status === filtroEstoque,
  );

  function copiarLinkDemo() {
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Seletores das 3 telas principais do painel */}
      <ol className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {paineis.map((p, i) => {
          const isAtivo = i === ativo;
          const span = i === 0 ? "lg:col-span-4" : i === 1 ? "lg:col-span-4" : "lg:col-span-4";
          return (
            <li
              key={p.tela}
              className={`ticks flex flex-col justify-between gap-4 p-5 sm:p-6 ${span} ${
                isAtivo ? "bg-paper-3 text-ink" : "bg-paper-2 text-ink-2"
              }`}
            >
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="num text-xs font-medium text-brand">Etapa 0{i + 1}</span>
                </div>
                <h3 className="font-display text-title font-semibold text-ink">{p.titulo}</h3>
                <p className="text-sm text-ink-2">{p.texto}</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setAtivo(i)}
                  aria-pressed={isAtivo}
                  className={`lp-ctrl inline-flex h-11 items-center rounded-sm px-4 text-xs font-medium ${
                    isAtivo
                      ? "bg-brand text-brand-ink"
                      : "border border-rule-2 bg-paper text-ink"
                  }`}
                >
                  {isAtivo ? "Visível abaixo" : "Abrir tela"}
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Moldura interativa do painel: segue o dispositivo automaticamente (Desktop no PC, Mobile no celular) */}
      <div
        aria-hidden="true"
        className={`ticks overflow-hidden border border-rule-2 bg-paper text-ink transition-colors duration-(--dur-long) ${
          forcarMobile ? "mx-auto w-full max-w-[26rem]" : "w-full"
        }`}
      >
        {/* Barra de controle do dispositivo (visível em telas grandes para testar ambos os formatos) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper-2 px-4 py-2.5 lg:px-6">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rule-2" />
            <span className="size-2.5 rounded-full bg-rule-2" />
            <span className="size-2.5 rounded-full bg-signal" />
            <span className="ml-2 text-xs text-ink-3">
              autogiro.app/painel/{ativo === 0 ? "estoque/novo" : ativo === 1 ? "estoque" : "interessados"}
            </span>
          </div>

          <div className="hidden items-center gap-1.5 lg:flex">
            <span className="mr-2 text-xs text-ink-3">Formato da prévia:</span>
            <button
              type="button"
              onClick={() => setDispositivo("auto")}
              className={`lp-ctrl inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs ${
                dispositivo !== "mobile"
                  ? "border-ink bg-ink text-paper"
                  : "border-rule-2 text-ink-2"
              }`}
            >
              <Monitor className="size-3.5" />
              <span>Desktop (seu ecrã)</span>
            </button>
            <button
              type="button"
              onClick={() => setDispositivo("mobile")}
              className={`lp-ctrl inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs ${
                dispositivo === "mobile"
                  ? "border-ink bg-ink text-paper"
                  : "border-rule-2 text-ink-2"
              }`}
            >
              <Smartphone className="size-3.5" />
              <span>Simular celular</span>
            </button>
          </div>
        </div>

        {/* Cabeçalho do App (com abas no topo em modo Desktop) */}
        <div className="border-b border-rule bg-paper px-4 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-6 lg:h-16">
            <div className="flex items-center gap-8">
              <Wordmark />
              {!forcarMobile && (
                <div className="hidden h-16 items-center gap-1 lg:flex">
                  {[
                    { id: 1, rotulo: "Estoque" },
                    { id: 2, rotulo: "Interessados" },
                    { id: 0, rotulo: "Cadastrar carro" },
                  ].map((tab) => {
                    const tabAtiva = ativo === tab.id;
                    return (
                      <button
                        key={tab.rotulo}
                        type="button"
                        onClick={() => setAtivo(tab.id)}
                        className={`relative flex h-full items-center px-3.5 text-sm font-medium transition-colors ${
                          tabAtiva ? "text-ink" : "text-ink-3 hover:text-ink"
                        }`}
                      >
                        {tab.rotulo}
                        {tabAtiva && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-brand" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <span className="hidden rounded-full border border-rule px-3 py-1 sm:inline-block">
                Exemplo Multimarcas · Campinas/SP
              </span>
            </div>
          </div>
        </div>

        {/* Corpo da tela ativa */}
        <div className="p-4 sm:p-6 lg:p-8">
          {ativo === 1 && (
            <div className="grid grid-cols-1 gap-6">
              {/* Cabeçalho do Estoque */}
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="font-display text-2xl font-semibold text-ink lg:text-3xl">Estoque</div>
                  <div className="text-sm text-ink-3">Exemplo Multimarcas · Vitrine ativa</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAtivo(0)}
                    className="lp-ctrl inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-brand-ink"
                  >
                    <Plus className="size-4" />
                    <span>Cadastrar novo carro</span>
                  </button>
                  <button
                    type="button"
                    onClick={copiarLinkDemo}
                    className="lp-ctrl inline-flex h-11 items-center gap-2 rounded-full border border-rule-2 bg-paper px-4 text-sm text-ink"
                  >
                    {copiado ? <Check className="size-4 text-signal" /> : <Copy className="size-4" />}
                    <span>{copiado ? "Link copiado!" : "Copiar link da vitrine"}</span>
                  </button>
                </div>
              </div>

              {/* Aviso de simulações novas */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-navy p-4 text-navy-ink lg:p-5">
                <div className="flex items-center gap-4">
                  <span className="num font-display text-3xl leading-none font-semibold lg:text-4xl">2</span>
                  <div className="min-w-0">
                    <div className="font-medium">Simulações novas esperando resposta</div>
                    <div className="text-sm text-navy-ink-2">
                      Quem simulou já mandou a CNH. Abra a aba de Interessados para responder.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAtivo(2)}
                  className="lp-ctrl inline-flex h-10 items-center rounded-full border border-navy-ink-2 px-4 text-xs font-medium whitespace-nowrap text-navy-ink"
                >
                  Ver interessados
                </button>
              </div>

              {/* Barra de busca e filtros funcionais */}
              <div
                className={`grid grid-cols-1 gap-3 ${
                  forcarMobile ? "" : "lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-center"
                }`}
              >
                <div className="relative flex h-11 items-center rounded-full border border-rule-2 bg-paper px-4 text-sm text-ink-3">
                  <Search className="mr-3 size-4 shrink-0" />
                  <span>Buscar por marca, modelo ou versão</span>
                </div>
                <div className={`flex flex-wrap gap-2 ${forcarMobile ? "" : "lg:justify-end"}`}>
                  {[
                    { id: "todos" as const, rotulo: "Todos", n: 4 },
                    { id: "disponivel" as const, rotulo: "Disponíveis", n: 3 },
                    { id: "vendido" as const, rotulo: "Vendidos", n: 1 },
                  ].map((f) => {
                    const isF = filtroEstoque === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFiltroEstoque(f.id)}
                        className={`lp-ctrl inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-medium ${
                          isF ? "border-ink bg-ink text-paper" : "border-rule-2 text-ink-2"
                        }`}
                      >
                        <span>{f.rotulo}</span>
                        <span className="num">{f.n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grade de veículos: 3-4 colunas no Desktop, 1 coluna no Mobile */}
              <div
                className={`grid grid-cols-1 gap-4 ${
                  forcarMobile ? "" : "sm:grid-cols-2 lg:grid-cols-4"
                }`}
              >
                {carrosFiltrados.map((c) => {
                  const vendido = c.status === "vendido";
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col overflow-hidden rounded-md border border-rule bg-paper-2"
                    >
                      <div className="relative aspect-[16/10] bg-paper-3">
                        {/* eslint-disable-next-line @next/next/no-img-element -- foto local da demonstração */}
                        <img
                          src={c.img}
                          alt=""
                          className={`size-full object-cover ${vendido ? "grayscale opacity-70" : ""}`}
                        />
                        <span
                          className={`absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            vendido
                              ? "border border-rule-2 bg-paper/90 text-ink-2"
                              : "bg-paper/90 text-ink"
                          }`}
                        >
                          {vendido ? "Vendido" : "Disponível"}
                        </span>
                        <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-xs text-paper">
                          <Images className="size-3" />
                          <span className="num">{c.fotos}</span>
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-2.5 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ink">
                              {c.marca} {c.modelo}
                            </div>
                            <div className="truncate text-xs text-ink-3">{c.versao}</div>
                          </div>
                          <div
                            className={`num shrink-0 font-display text-base font-semibold ${
                              vendido ? "text-ink-3 line-through" : "text-ink"
                            }`}
                          >
                            {c.preco}
                          </div>
                        </div>
                        <div className="text-xs text-ink-3">
                          {c.ano} · {c.km} · {c.cambio} · {c.combustivel}
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-rule pt-2.5 text-xs text-ink-2">
                          <button
                            type="button"
                            onClick={() => setAtivo(0)}
                            className="inline-flex items-center gap-1 hover:text-ink"
                          >
                            <Pencil className="size-3" /> Editar
                          </button>
                          {!vendido && (
                            <span className="inline-flex items-center gap-1 text-ink-3">
                              <ExternalLink className="size-3" /> Na vitrine
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ativo === 0 && (
            <div
              className={`grid grid-cols-1 gap-8 ${
                forcarMobile ? "" : "lg:grid-cols-12 lg:gap-10"
              }`}
            >
              {/* Coluna esquerda no desktop: Fotos */}
              <div className={`grid content-start gap-4 ${forcarMobile ? "" : "lg:col-span-5"}`}>
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-xl font-semibold text-ink">Fotos do veículo</div>
                  <span className="num text-xs text-ink-3">3 de 15 fotos</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex aspect-[5/4] flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-rule-2 bg-paper-2 p-2 text-center text-xs text-ink-2">
                    <Camera className="size-5 text-brand" />
                    <span>Adicionar fotos</span>
                  </div>
                  <div className="relative aspect-[5/4] overflow-hidden rounded-md border border-rule">
                    {/* eslint-disable-next-line @next/next/no-img-element -- foto local */}
                    <img src="/landing/cars/corolla.jpg" alt="" className="size-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/85 px-2 py-0.5 text-[11px] text-paper">
                      Capa
                    </span>
                  </div>
                  <div className="relative aspect-[5/4] overflow-hidden rounded-md border border-rule">
                    {/* eslint-disable-next-line @next/next/no-img-element -- foto local */}
                    <img src="/landing/cars/onix.jpg" alt="" className="size-full object-cover" />
                  </div>
                </div>
                <div className="rounded-md bg-paper-2 p-3.5 text-xs text-ink-2">
                  Compressão automática no navegador: fotos de 8 MB da câmera do celular caem para menos de 300 KB sem perder nitidez.
                </div>
              </div>

              {/* Coluna direita no desktop: Campos de identificação, preço e pílulas de um toque */}
              <div className={`grid content-start gap-5 ${forcarMobile ? "" : "lg:col-span-7"}`}>
                <div className="font-display text-xl font-semibold text-ink">Identificação, preço e especificações</div>
                <div className={`grid grid-cols-1 gap-4 ${forcarMobile ? "" : "sm:grid-cols-2"}`}>
                  <div className="grid gap-1.5">
                    <span className="text-xs font-medium text-ink-2">Marca</span>
                    <div className="flex h-11 items-center rounded-md border border-rule-2 bg-paper-2 px-3.5 text-sm text-ink">
                      Toyota
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <span className="text-xs font-medium text-ink-2">Modelo e versão</span>
                    <div className="flex h-11 items-center rounded-md border border-rule-2 bg-paper-2 px-3.5 text-sm text-ink">
                      Corolla XEi 2.0 Direct Shift
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <span className="text-xs font-medium text-ink-2">Ano</span>
                    <div className="num flex h-11 items-center rounded-md border border-rule-2 bg-paper-2 px-3.5 text-sm text-ink">
                      2021
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <span className="text-xs font-medium text-ink-2">Quilometragem</span>
                    <div className="num flex h-11 items-center justify-between rounded-md border border-rule-2 bg-paper-2 px-3.5 text-sm text-ink">
                      <span>42.000</span>
                      <span className="text-ink-3">km</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-medium text-ink-2">Preço de venda na vitrine</span>
                  <div className="num flex h-13 items-center gap-2 rounded-md border border-brand bg-paper-2 px-4 font-display text-2xl font-semibold text-ink">
                    <span className="text-base font-normal text-ink-3">R$</span>
                    <span>124.900</span>
                  </div>
                </div>

                <div className={`grid grid-cols-1 gap-4 border-t border-rule pt-4 ${forcarMobile ? "" : "sm:grid-cols-2"}`}>
                  <div className="grid gap-2">
                    <span className="text-xs font-medium text-ink-2">Câmbio (1 toque)</span>
                    <div className="flex flex-wrap gap-2">
                      {(["Automático", "Manual"] as const).map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setCambioDemo(op)}
                          className={`lp-ctrl inline-flex h-10 items-center rounded-full border px-4 text-xs font-medium ${
                            cambioDemo === op ? "border-ink bg-ink text-paper" : "border-rule-2 text-ink-2"
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <span className="text-xs font-medium text-ink-2">Combustível (1 toque)</span>
                    <div className="flex flex-wrap gap-2">
                      {(["Flex", "Gasolina", "Híbrido"] as const).map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setCombustivelDemo(op)}
                          className={`lp-ctrl inline-flex h-10 items-center rounded-full border px-4 text-xs font-medium ${
                            combustivelDemo === op ? "border-ink bg-ink text-paper" : "border-rule-2 text-ink-2"
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {ativo === 2 && (
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="font-display text-2xl font-semibold text-ink lg:text-3xl">Interessados</div>
                  <div className="text-sm text-ink-3">2 simulações novas recebidas pela vitrine com CNH anexada.</div>
                </div>
                <span className="inline-flex h-9 items-center rounded-full border border-signal px-3.5 text-xs font-medium text-signal">
                  LGPD ativo · exclusão automática em 90 dias
                </span>
              </div>

              <div className={`grid grid-cols-1 gap-6 ${forcarMobile ? "" : "lg:grid-cols-2"}`}>
                {LEADS_EXEMPLO.map((l) => {
                  const chaveAberta = cnhAberta === l.id;
                  return (
                    <div
                      key={l.id}
                      className="grid content-start gap-4 rounded-md border border-rule-2 bg-paper-2 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy font-display text-sm font-semibold text-navy-ink">
                          {l.iniciais}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-base font-semibold text-ink">{l.nome}</div>
                          <div className="flex flex-wrap gap-x-3 text-xs text-ink-3">
                            <span>{l.tempo}</span>
                            <span className="num">{l.telefone}</span>
                          </div>
                        </div>
                        <span className="inline-flex h-7 items-center rounded-full border border-signal px-3 text-xs font-medium text-signal">
                          Novo
                        </span>
                      </div>

                      <div className="flex items-center gap-3 border-y border-rule py-3">
                        {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local */}
                        <img src={l.img} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-ink-3">Carro de interesse</div>
                          <div className="truncate text-sm font-medium text-ink">{l.carro}</div>
                        </div>
                        <span className="num text-sm font-medium text-ink-2">{l.preco}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 rounded-md bg-paper p-3.5">
                        <div>
                          <div className="text-xs text-ink-3">Entrada</div>
                          <div className="num font-display text-base font-semibold text-ink">{l.entrada}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-3">A financiar</div>
                          <div className="num font-display text-base font-semibold text-ink">{l.financiar}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-3">Parcelas</div>
                          <div className="num font-display text-base font-semibold text-ink">{l.parcelas}</div>
                        </div>
                      </div>

                      <div className={`grid grid-cols-1 gap-2.5 ${forcarMobile ? "" : "sm:grid-cols-2"}`}>
                        <button
                          type="button"
                          onClick={() => setCnhAberta(chaveAberta ? null : l.id)}
                          className="lp-ctrl inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rule-2 bg-paper px-4 text-xs font-medium text-ink"
                        >
                          <IdCard className="size-4 text-brand" />
                          <span>{chaveAberta ? "Chave assinada (04:59)" : "Ver CNH · vale 5 min"}</span>
                        </button>
                        <span className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-signal px-4 text-xs font-medium text-signal-ink">
                          <MessageCircle className="size-4" />
                          <span>Chamar no WhatsApp</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Barra inferior de abas: aparece automaticamente em dispositivos Mobile ou quando "Simular celular" está ativo */}
        <div
          className={`border-t border-rule bg-paper-2 px-4 py-2 ${
            forcarMobile ? "block" : "lg:hidden"
          }`}
        >
          <div className="mx-auto flex max-w-md justify-around">
            {[
              { id: 1, rotulo: "Estoque", Icone: Car },
              { id: 2, rotulo: "Interessados", Icone: Users },
              { id: 0, rotulo: "Cadastro", Icone: Store },
            ].map((item) => {
              const isTab = ativo === item.id;
              return (
                <button
                  key={item.rotulo}
                  type="button"
                  onClick={() => setAtivo(item.id)}
                  className={`flex h-12 flex-col items-center justify-center gap-1 px-4 text-xs font-medium ${
                    isTab ? "text-brand" : "text-ink-3"
                  }`}
                >
                  <item.Icone className="size-5" />
                  <span>{item.rotulo}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
