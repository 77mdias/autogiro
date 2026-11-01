"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Um carro "escaneado": só pontos, cor pela altura, uma varredura que acende o que toca e
 * um trecho da porta em verde (a simulação que chegou). Medidas em metros, z para cima.
 */

// Perfil lateral (x, altura do topo): para-choque traseiro, porta-malas, vidro, teto, para-brisa, capô
const PERFIL: [number, number][] = [
  [-2.3, 0.78], [-2.18, 0.9], [-1.9, 0.96], [-1.5, 1.0], [-1.12, 1.38], [-0.95, 1.44],
  [0.2, 1.46], [0.45, 1.43], [1.05, 1.02], [1.6, 0.92], [2.12, 0.84], [2.3, 0.66],
];
const LINHA = 0.98; // base dos vidros
const TETO = 1.46;
const CHAO = 0.3;
const RODA = { x: 1.42, y: 0.8, r: 0.33 };

function topo(x: number) {
  if (x <= PERFIL[0][0]) return PERFIL[0][1];
  for (let i = 1; i < PERFIL.length; i++) {
    const [x1, z1] = PERFIL[i];
    if (x <= x1) {
      const [x0, z0] = PERFIL[i - 1];
      return z0 + ((x - x0) / (x1 - x0)) * (z1 - z0);
    }
  }
  return PERFIL[PERFIL.length - 1][1];
}
const larguraCorpo = (x: number) => 0.86 * (1 - 0.22 * Math.min(1, Math.max(0, (Math.abs(x) - 1.85) / 0.45)) ** 2);
const largura = (x: number, z: number) =>
  z <= LINHA ? larguraCorpo(x) : larguraCorpo(x) + ((0.64 - larguraCorpo(x)) * (z - LINHA)) / (TETO - LINHA);
const naCaixaDeRoda = (x: number, z: number) =>
  z < 0.74 && Math.min(Math.hypot(x - RODA.x, z - RODA.r), Math.hypot(x + RODA.x, z - RODA.r)) < RODA.r + 0.06;

// Tipos de ponto: 0 lataria, 1 vidro, 2 roda, 3 chão, 4 achado (verde)
function gerarNuvem() {
  let s = 20785;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const xs: number[] = [], ys: number[] = [], zs: number[] = [], tipo: number[] = [];
  const add = (x: number, y: number, z: number, t: number) => (xs.push(x), ys.push(y), zs.push(z), tipo.push(t));

  // Laterais
  for (let n = 0; n < 7000; n++) {
    const x = -2.3 + rnd() * 4.6;
    const z = CHAO + rnd() * (topo(x) - CHAO);
    if (naCaixaDeRoda(x, z)) continue;
    const lado = rnd() < 0.5 ? -1 : 1;
    const vidro = z > LINHA + 0.03 && topo(x) > LINHA + 0.12;
    if (vidro && rnd() > 0.28) continue;
    const achado = lado === 1 && x > 0.15 && x < 0.95 && z > 0.5 && z < 0.82;
    add(x, lado * largura(x, z), z, achado ? 4 : vidro ? 1 : 0);
  }
  // Topo (capô, teto, porta-malas) com o abaulado do teto
  for (let n = 0; n < 5200; n++) {
    const x = -2.3 + rnd() * 4.6;
    const zt = topo(x);
    const w = largura(x, zt);
    const u = rnd() * 2 - 1;
    const inclinado = (x > 0.45 && x < 1.05) || (x > -1.5 && x < -1.0);
    if (inclinado && rnd() > 0.32) continue;
    add(x, u * w, zt - 0.04 * u * u, inclinado ? 1 : 0);
  }
  // Frente e traseira
  for (let n = 0; n < 900; n++) {
    const fx = rnd() < 0.5 ? -2.3 : 2.3;
    const z = 0.36 + rnd() * 0.42;
    add(fx - Math.sign(fx) * 0.04 * rnd(), (rnd() * 2 - 1) * larguraCorpo(fx), z, 0);
  }
  // Rodas: banda do pneu, flanco e cinco raios
  for (const cx of [-RODA.x, RODA.x])
    for (const cy of [-RODA.y, RODA.y])
      for (let n = 0; n < 720; n++) {
        const a = rnd() * Math.PI * 2;
        const k = rnd();
        if (k < 0.45) add(cx + RODA.r * Math.cos(a), cy + (rnd() * 0.22 - 0.11), RODA.r + RODA.r * Math.sin(a), 2);
        else {
          const r = k < 0.8 ? 0.2 + rnd() * 0.13 : rnd() * 0.2;
          const raio = ((a * 180) / Math.PI) % 72 < 14 || r < 0.06;
          if (r < 0.2 && !raio) continue;
          add(cx + r * Math.cos(a), cy + Math.sign(cy) * 0.11, RODA.r + r * Math.sin(a), 2);
        }
      }
  // Um pedaço do chão escaneado em volta, rarefeito para fora
  for (let n = 0; n < 2600; n++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 1.15;
    if (r < 0.62 && rnd() < 0.85) continue;
    add(Math.cos(a) * r * 3.3, Math.sin(a) * r * 2.0, 0, 3);
  }
  return { xs: Float32Array.from(xs), ys: Float32Array.from(ys), zs: Float32Array.from(zs), tipo: Uint8Array.from(tipo) };
}

const NIVEIS = 10;
const ANCORAS = { achado: [0.55, 0.86, 0.68], fotos: [-0.35, 0, TETO] } as const;

export function PointCar({ className }: { className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const rotuloAchado = useRef<HTMLSpanElement>(null);
  const rotuloFotos = useRef<HTMLSpanElement>(null);
  const [pausado, setPausado] = useState(false);
  const pausadoRef = useRef(false);
  useEffect(() => {
    pausadoRef.current = pausado;
  }, [pausado]);

  useEffect(() => {
    const box = caixa.current!, cv = tela.current!;
    const rotulos = { achado: rotuloAchado.current, fotos: rotuloFotos.current };
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const nuvem = gerarNuvem();
    const total = nuvem.xs.length;
    const sx = new Float32Array(total), sy = new Float32Array(total);
    const grupo = new Uint16Array(total);

    // Cores vêm dos tokens (tokens.css); a mistura sai em oklch pronta para o canvas
    const css = getComputedStyle(box);
    const tok = (n: string) => css.getPropertyValue(n).trim();
    const amostra = document.createElement("span");
    box.appendChild(amostra);
    const misturar = (a: string, b: string, p: number) => {
      amostra.style.color = `color-mix(in oklch, ${a}, ${b} ${p}%)`;
      return getComputedStyle(amostra).color;
    };
    const [lo, mid, hi] = [tok("--color-point-lo"), tok("--color-point-mid"), tok("--color-point-hi")];
    const paleta = Array.from({ length: NIVEIS }, (_, i) => {
      const t = i / (NIVEIS - 1);
      return t < 0.5 ? misturar(lo, mid, t * 200) : misturar(mid, hi, (t - 0.5) * 200);
    });
    const verde = tok("--color-signal");
    const linha = tok("--color-ink-3");
    amostra.remove();

    let W = 0, H = 0, dpr = 1;
    const medir = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = box.clientWidth;
      H = box.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(box);

    const quieto = matchMedia("(prefers-reduced-motion: reduce)");
    let theta = -0.62, inclinacao = 0, alvoTheta = 0, alvoIncl = 0, varredura = 0.35;
    let visivel = true, sobre = false, ultimo = performance.now(), quadro = 0, tempo = 0;

    const projetar = (x: number, y: number, z: number, out: { x: number; y: number; d: number }) => {
      const th = theta + alvoTheta, ph = 0.34 + inclinacao;
      const xr = x * Math.cos(th) - y * Math.sin(th);
      const yr = x * Math.sin(th) + y * Math.cos(th);
      const prof = yr * Math.cos(ph) + z * Math.sin(ph);
      const escala = Math.min(W / 6.6, (0.92 * H) / 3.2);
      const p = 7 / (7 + prof);
      out.x = W / 2 + xr * escala * p;
      out.y = H * 0.6 - (z * Math.cos(ph) - yr * Math.sin(ph)) * escala * p;
      out.d = prof;
      return out;
    };
    const tmp = { x: 0, y: 0, d: 0 };

    const desenhar = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const pos = varredura * 6.2 - 3.1;
      for (let i = 0; i < total; i++) {
        const t = nuvem.tipo[i];
        projetar(nuvem.xs[i], nuvem.ys[i], nuvem.zs[i], tmp);
        sx[i] = tmp.x;
        sy[i] = tmp.y;
        const luz = Math.exp(-(((nuvem.xs[i] - pos) / 0.22) ** 2));
        const altura = t === 3 ? 0.05 : nuvem.zs[i] / TETO;
        const nivel = Math.min(NIVEIS - 1, Math.round((altura * 0.75 + luz * 0.6) * (NIVEIS - 1)));
        const fundo = tmp.d > 0.4 ? 1 : 0; // lado de lá do carro fica mais apagado
        grupo[i] = t === 4 ? 255 : nivel * 4 + (t === 1 || t === 3 ? 2 : 0) + fundo;
      }
      const tam = Math.max(1.1, Math.min(W, 900) / 560);
      for (let g = 0; g < NIVEIS * 4; g++) {
        const nivel = g >> 2, fraco = (g & 2) !== 0, fundo = (g & 1) !== 0;
        ctx.fillStyle = paleta[nivel];
        ctx.globalAlpha = (fraco ? 0.45 : 0.9) * (fundo ? 0.55 : 1);
        for (let i = 0; i < total; i++) if (grupo[i] === g) ctx.fillRect(sx[i], sy[i], tam, tam);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = verde;
      for (let i = 0; i < total; i++) if (grupo[i] === 255) ctx.fillRect(sx[i] - 0.3, sy[i] - 0.3, tam + 0.6, tam + 0.6);

      // Chamadas: um fio fino do ponto medido até o rótulo; somem quando o ponto vai para trás
      for (const chave of ["achado", "fotos"] as const) {
        const el = rotulos[chave];
        if (!el) continue;
        const [ax, ay, az] = ANCORAS[chave];
        projetar(ax, ay, az, tmp);
        const atras = chave === "achado" && tmp.d > 0.3;
        const lx = Math.min(W - el.offsetWidth - 8, Math.max(8, tmp.x + (chave === "achado" ? 36 : -el.offsetWidth - 28)));
        const ly = Math.max(8, tmp.y - (chave === "achado" ? 96 : 110));
        el.style.transform = `translate(${lx}px, ${ly}px)`;
        el.style.opacity = atras ? "0" : "1";
        if (atras) continue;
        ctx.strokeStyle = chave === "achado" ? verde : linha;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tmp.x, tmp.y);
        ctx.lineTo(lx + (chave === "achado" ? 0 : el.offsetWidth), ly + el.offsetHeight);
        ctx.stroke();
        ctx.fillStyle = chave === "achado" ? verde : linha;
        ctx.beginPath();
        ctx.arc(tmp.x, tmp.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const passo = (agora: number) => {
      const dt = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;
      const rodando = visivel && !sobre && !pausadoRef.current && !quieto.matches;
      if (rodando) {
        tempo += dt;
        theta += ((Math.PI * 2) / 70) * dt; // uma volta em 70 s
        const ciclo = (tempo % 7) / 7; // varredura a cada 7 s, entra e sai suave
        varredura = ciclo < 0.6 ? 0.5 - 0.5 * Math.cos((ciclo / 0.6) * Math.PI) : 1.2;
      }
      inclinacao += (alvoIncl - inclinacao) * 0.08;
      if (visivel) desenhar();
      quadro = requestAnimationFrame(passo);
    };

    const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting));
    io.observe(box);
    const mover = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      alvoTheta = ((e.clientX - r.left) / r.width - 0.5) * 0.16;
      alvoIncl = ((e.clientY - r.top) / r.height - 0.5) * 0.08;
    };
    const entrar = () => (sobre = true);
    const sair = () => ((sobre = false), (alvoTheta = 0), (alvoIncl = 0));
    box.addEventListener("pointermove", mover);
    box.addEventListener("pointerenter", entrar);
    box.addEventListener("pointerleave", sair);

    desenhar();
    quadro = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(quadro);
      ro.disconnect();
      io.disconnect();
      box.removeEventListener("pointermove", mover);
      box.removeEventListener("pointerenter", entrar);
      box.removeEventListener("pointerleave", sair);
    };
  }, []);

  return (
    <figure
      ref={caixa}
      className={className}
      role="img"
      aria-label="Um carro desenhado em pontos girando devagar, com o trecho da porta aceso em verde: uma simulação nova chegou."
    >
      <canvas ref={tela} aria-hidden className="absolute inset-0 size-full" />
      <span
        ref={rotuloAchado}
        aria-hidden
        className="absolute top-0 left-0 grid gap-0.5 bg-paper/85 px-3 py-2 text-sm transition-opacity duration-(--dur-short) motion-reduce:transition-none"
      >
        <span className="text-signal">Simulação nova</span>
        <span className="text-ink-3">CNH anexada</span>
      </span>
      <span
        ref={rotuloFotos}
        aria-hidden
        className="absolute top-0 left-0 grid gap-0.5 bg-paper/85 px-3 py-2 text-sm"
      >
        <span className="text-ink">Até 15 fotos</span>
        <span className="text-ink-3">por carro</span>
      </span>
      <button
        type="button"
        onClick={() => setPausado((p) => !p)}
        aria-pressed={pausado}
        className="absolute right-4 bottom-2 inline-flex h-9 lg:right-(--gutter) lg:bottom-8 items-center rounded-full border border-rule-2 px-4 text-sm text-ink-2 transition-colors duration-(--dur-micro) hover:text-ink motion-reduce:hidden"
      >
        {pausado ? "Girar" : "Pausar"}
      </button>
    </figure>
  );
}
