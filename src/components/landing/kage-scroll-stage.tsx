"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DPR_MAX, tierDoNavegador } from "@/lib/landing-tier";

/** Libera geometrias, materiais e texturas (inclusive as que vivem em uniforms de ShaderMaterial). */
function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh && !(o as THREE.Points).isPoints && !(o as THREE.Sprite).isSprite) return;
    if (!(o as THREE.Sprite).isSprite) mesh.geometry?.dispose(); // sprites dividem uma geometria interna do three
    for (const mat of [mesh.material].flat()) {
      if (!mat) continue;
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
      const uniforms = (mat as THREE.ShaderMaterial).uniforms;
      if (uniforms) for (const u of Object.values(uniforms)) if (u.value instanceof THREE.Texture) u.value.dispose();
      mat.dispose();
    }
  });
}

type CamWaypoint = {
  p: [number, number, number];
  t: [number, number, number];
  fov: number;
  label: string;
  code: string;
};

/**
 * 6 waypoints de câmera ao longo da spline CatmullRomCurve3 (inspirado diretamente em `CAM` de MengTo/kage).
 * Cada seção `[data-cam="0..5"]` da landing page ancora um capítulo espacial no corredor 3D.
 */
const CAM_WAYPOINTS: CamWaypoint[] = [
  {
    p: [0, 2.25, 11.2],
    t: [0, 2.15, -18],
    fov: 46,
    code: "00",
    label: "Início · Showroom",
  },
  {
    p: [-0.85, 2.15, 2.4],
    t: [0.35, 2.25, -24],
    fov: 44,
    code: "01",
    label: "Travessia 3D · Pátio",
  },
  {
    p: [0.92, 2.45, -9.8],
    t: [-0.3, 2.35, -34],
    fov: 42,
    code: "02",
    label: "Telemetria · Giro",
  },
  {
    p: [-0.55, 2.75, -21.5],
    t: [0.2, 2.55, -45],
    fov: 40,
    code: "03",
    label: "Operação · Pilares",
  },
  {
    p: [0.45, 2.95, -32.8],
    t: [0.0, 3.35, -56],
    fov: 38,
    code: "04",
    label: "Fluxo · 4 Passos",
  },
  {
    p: [0, 3.55, -42.5],
    t: [1.1, 6.8, -66],
    fov: 35,
    code: "05",
    label: "Horizonte · Estrada",
  },
];

type WorldPlateSpec = {
  src: string;
  title: string;
  tag: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  rotY: number;
  accent: [number, number, number];
  phase: number;
};

/**
 * Todas as imagens de `public/landing` dispostas em profundidade (eixo Z) ao longo da câmera.
 * Fotos em `public/landing/web/` (webp até 1600 px, ver docs/landing-3d.md); os originais não são baixados.
 */
const WORLD_PLATES: WorldPlateSpec[] = [
  {
    src: "/landing/web/garagem.webp",
    title: "O Pátio Silencioso",
    tag: "01 · ESTOQUE VIVO",
    x: -3.55,
    y: 2.32,
    z: 4.8,
    w: 3.5,
    h: 2.25,
    rotY: 0.24,
    accent: [0.16, 0.49, 1.0],
    phase: 0.2,
  },
  {
    src: "/landing/web/garagem-2.webp",
    title: "Luz de Showroom",
    tag: "02 · VITRINE DE PRECISÃO",
    x: 3.65,
    y: 2.42,
    z: -1.4,
    w: 3.6,
    h: 2.3,
    rotY: -0.25,
    accent: [0.2, 0.83, 0.6],
    phase: 1.4,
  },
  {
    src: "/landing/cadastro.png",
    title: "Cadastro em 1 Minuto",
    tag: "HUD · ENTRADA RÁPIDA",
    x: -3.25,
    y: 2.75,
    z: -7.2,
    w: 3.2,
    h: 2.05,
    rotY: 0.2,
    accent: [0.35, 0.65, 1.0],
    phase: 2.1,
  },
  {
    src: "/landing/web/painel-car.webp",
    title: "Pulso de Giro · 6000 RPM",
    tag: "03 · TELEMETRIA DE CAPITAL",
    x: 3.45,
    y: 2.48,
    z: -13.2,
    w: 3.55,
    h: 2.28,
    rotY: -0.22,
    accent: [0.96, 0.62, 0.04],
    phase: 3.0,
  },
  {
    src: "/landing/estoque.png",
    title: "Controle de Dias Parados",
    tag: "HUD · SEMÁFORO DE PÁTIO",
    x: -3.35,
    y: 2.68,
    z: -18.8,
    w: 3.3,
    h: 2.1,
    rotY: 0.21,
    accent: [0.2, 0.83, 0.6],
    phase: 3.8,
  },
  {
    src: "/landing/web/carro-dentro.webp",
    title: "Visão do Cockpit",
    tag: "04 · DECISÃO NO VOLANTE",
    x: 3.5,
    y: 2.42,
    z: -24.4,
    w: 3.5,
    h: 2.25,
    rotY: -0.23,
    accent: [0.16, 0.49, 1.0],
    phase: 4.5,
  },
  {
    src: "/landing/interessados.png",
    title: "Fila Inteligente de Leads",
    tag: "HUD · MATCH AUTOMÁTICO",
    x: -3.25,
    y: 2.65,
    z: -29.8,
    w: 3.2,
    h: 2.05,
    rotY: 0.19,
    accent: [0.2, 0.83, 0.6],
    phase: 5.2,
  },
  {
    src: "/landing/web/benjamin-zhao-5DremXTTKE0-unsplash.webp",
    title: "Engenharia em Movimento",
    tag: "05 · LIQUIDEZ REAL",
    x: 3.45,
    y: 2.55,
    z: -35.2,
    w: 3.6,
    h: 2.3,
    rotY: -0.21,
    accent: [0.38, 0.68, 1.0],
    phase: 5.9,
  },
  {
    src: "/landing/web/estrada.webp",
    title: "A Estrada Aberta",
    tag: "06 · VENDA CONCLUÍDA",
    x: -3.15,
    y: 2.72,
    z: -40.8,
    w: 3.7,
    h: 2.35,
    rotY: 0.18,
    accent: [0.2, 0.83, 0.6],
    phase: 6.6,
  },
  // Placas satélites dos veículos de estoque (`public/landing/cars/*`)
  {
    src: "/landing/cars/corolla.jpg",
    title: "Corolla XEi · 8d",
    tag: "GIRO RÁPIDO",
    x: -5.4,
    y: 1.55,
    z: -4.2,
    w: 2.1,
    h: 1.38,
    rotY: 0.32,
    accent: [0.2, 0.83, 0.6],
    phase: 0.9,
  },
  {
    src: "/landing/cars/tcross.jpg",
    title: "T-Cross Highline · 6d",
    tag: "3 INTERESSADOS",
    x: 5.4,
    y: 1.6,
    z: -16.0,
    w: 2.1,
    h: 1.38,
    rotY: -0.32,
    accent: [0.16, 0.49, 1.0],
    phase: 2.5,
  },
  {
    src: "/landing/cars/onix.jpg",
    title: "Onix LTZ · 19d",
    tag: "MARGEM R$ 6.3K",
    x: -5.3,
    y: 1.65,
    z: -27.0,
    w: 2.1,
    h: 1.38,
    rotY: 0.3,
    accent: [0.96, 0.62, 0.04],
    phase: 4.1,
  },
  {
    src: "/landing/cars/hb20x.jpg",
    title: "HB20X Diamond · 47d",
    tag: "ALERTA DE GIRO",
    x: 5.3,
    y: 1.7,
    z: -38.0,
    w: 2.1,
    h: 1.38,
    rotY: -0.3,
    accent: [0.96, 0.62, 0.04],
    phase: 5.5,
  },
];

const PLATE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uScrollVel;
  uniform float uPhase;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 p = position;
    float sway = sin(uTime * 1.35 + uPhase + p.x * 1.4 + p.y * 1.1) * 0.045;
    float velBend = sin(uv.y * 3.14159265) * clamp(uScrollVel * 0.14, -0.38, 0.38);
    float edgeLift = cos((uv.x - 0.5) * 3.14159265) * 0.03 * sin(uTime * 0.9 + uPhase);
    p.z += sway + velBend + edgeLift;
    p.x += sin(uTime * 0.7 + uPhase) * 0.02 * uv.y;
    vWave = sway + velBend;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const PLATE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3 uAccent;
  varying vec2 vUv;
  varying float vWave;

  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    if (uOpacity <= 0.005) discard;
    vec2 centered = vUv - 0.5;
    float d = sdRoundedBox(centered, vec2(0.485, 0.485), 0.045);
    float mask = 1.0 - smoothstep(-0.006, 0.008, d);
    if (mask <= 0.005) discard;

    vec2 uv = clamp(vUv + vec2(vWave * 0.015, 0.0), 0.002, 0.998);
    vec4 tex = texture2D(uMap, uv);

    // Sombra interna suave + brilho especular de dobra
    float vig = smoothstep(0.75, 0.18, length(centered));
    vec3 col = tex.rgb * mix(0.76, 1.06, vig);
    col += uAccent * max(vWave * 1.6, 0.0) * 0.25;

    // Borda luminosa fina estilo Kage
    float border = 1.0 - smoothstep(0.0, 0.013, abs(d + 0.004));
    float pulse = 0.65 + 0.35 * sin(uTime * 1.8 + vUv.x * 4.0);
    col = mix(col, uAccent * 1.35, border * 0.52 * pulse);

    gl_FragColor = vec4(col, mask * uOpacity * tex.a);
  }
`;

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (cur: number, to: number, rate: number, dt: number) =>
  lerp(cur, to, 1 - Math.exp(-rate * dt));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3);

function createCanvasTexture(
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 256,
  h = 256,
  repeat = false,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (ctx) drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  return tex;
}

/**
 * Converte uma imagem de `public/landing` em uma placa 2D pré-escalada (máx 1024px)
 * com cabeçalho de telemetria e rodapé editorial para uso eficiente como textura 3D.
 */
function buildWorldPlateCanvas(
  img: HTMLImageElement,
  spec: WorldPlateSpec,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const w = 768;
  const h = 496;
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return c;

  ctx.fillStyle = "#060b16";
  ctx.fillRect(0, 0, w, h);

  const scale = Math.max(w / Math.max(1, img.naturalWidth), h / Math.max(1, img.naturalHeight));
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(4, 8, 18, 0.52)");
  grad.addColorStop(0.35, "rgba(4, 8, 18, 0.06)");
  grad.addColorStop(0.68, "rgba(4, 8, 18, 0.14)");
  grad.addColorStop(1, "rgba(4, 8, 18, 0.88)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Tag superior
  ctx.fillStyle = "rgba(7, 13, 25, 0.72)";
  ctx.fillRect(28, 24, 290, 38);
  const [ar, ag, ab] = spec.accent;
  ctx.fillStyle = `rgb(${Math.round(ar * 255)}, ${Math.round(ag * 255)}, ${Math.round(ab * 255)})`;
  ctx.beginPath();
  ctx.arc(48, 43, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(244, 247, 253, 0.92)";
  ctx.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(spec.tag, 64, 48);

  // Título inferior na placa
  ctx.fillStyle = "rgba(244, 247, 253, 0.96)";
  ctx.font = "700 28px system-ui, -apple-system, sans-serif";
  ctx.fillText(spec.title, 30, h - 34);

  return c;
}

/**
 * Cria a textura circular do Horizonte ("Sol de Giro" com `/landing/painel-car.jpg`),
 * equivalente à lua vermelha de MengTo/kage no fundo do caminho.
 */
function buildTachometerMoonCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const size = 768;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return c;

  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.48, 0, Math.PI * 2);
  ctx.clip();

  const scale = Math.max(size / Math.max(1, img.naturalWidth), size / Math.max(1, img.naturalHeight));
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);

  const radial = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.08,
    size * 0.5,
    size * 0.5,
    size * 0.48,
  );
  radial.addColorStop(0, "rgba(37, 99, 235, 0.14)");
  radial.addColorStop(0.65, "rgba(10, 22, 48, 0.32)");
  radial.addColorStop(1, "rgba(4, 9, 20, 0.85)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  // Anel graduado de telemetria
  ctx.strokeStyle = "rgba(96, 165, 250, 0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.465, 0, Math.PI * 2);
  ctx.stroke();

  return c;
}

/**
 * Palco 3D fixo em tela cheia inspirado em `MengTo/kage` (`mengto.github.io/kage`):
 * - Câmera guiada por `THREE.CatmullRomCurve3` mapeada às seções `[data-cam="0..5"]`.
 * - Piso escuro de showroom com juntas procedurais e ondas de radar/chuva (`WORLD.ripples`).
 * - Portais arquitetônicos iluminados ao longo do corredor Z.
 * - Todas as fotografias e telas de `public/landing` posicionadas em planos 3D com shaders GLSL
 *   de ondulação por velocidade de scroll e dissolução por proximidade (`smoothstep`).
 * - Disco de horizonte com `/landing/painel-car.jpg` + halo aditivo, partículas e rastro de luz no cursor (`WISP`).
 * - Rail lateral de navegação por capítulos (`.kage-rail`) e coreografia de saída do Hero (`[data-hero-exit]`).
 */
export function KageScrollStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [activeCam, setActiveCam] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tier = tierDoNavegador();
    const isHeadless = typeof navigator !== "undefined" && navigator.webdriver;

    // Coreografia de saída dos elementos do Hero conforme scroll (idêntico a `wireHeroExit` do Kage)
    const heroExitEls = Array.from(document.querySelectorAll<HTMLElement>("[data-hero-exit]"));
    const updateHeroExit = () => {
      const vh = Math.max(window.innerHeight, 1);
      const t = clamp(window.scrollY / (vh * 0.42), 0, 1);
      for (const el of heroExitEls) {
        const lag = Number(el.dataset.heroExit) || 0;
        const lt = clamp((t - lag * 0.14) / (1 - lag * 0.14), 0, 1);
        const e = lt * lt * (3 - 2 * lt);
        el.style.opacity = String(1 - e);
        el.style.transform = `translate3d(0, ${(-e * 16).toFixed(1)}px, 0)`;
        el.style.filter = e > 0.02 ? `blur(${(e * 5).toFixed(1)}px)` : "none";
        el.style.pointerEvents = e > 0.65 ? "none" : "";
      }
    };
    updateHeroExit();

    // Sem cena 3D, o rail e a saída do hero continuam seguindo o scroll (contrato: só a cena vira pôster)
    const trackScrollOnly = () => {
      const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-cam]"));
      const onScroll = () => {
        const mid = window.innerHeight * 0.5;
        let idx = 0;
        secs.forEach((s, i) => {
          if (s.getBoundingClientRect().top <= mid) idx = i;
        });
        setActiveCam(idx);
        updateHeroExit();
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    };

    if (isHeadless) return trackScrollOnly();

    // Canvas criado aqui (não no JSX): no desmonte o contexto é destruído junto, então StrictMode e HMR
    // não acumulam contextos. Sem WebGL2 (GPU desligada, limite de contextos) o pôster do JSX continua visível.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "pointer-events-none fixed inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-700";
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: tier === "alto",
      depth: true,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) return trackScrollOnly();
    host.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, context: gl });
    } catch {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
      return trackScrollOnly();
    }

    // DPR por tier e escala adaptativa pelo tempo de frame (padrão PERF.scale do Kage)
    const baseDpr = Math.min(window.devicePixelRatio || 1, DPR_MAX[tier]);
    let dprScale = 1;
    const applySize = () => {
      renderer.setPixelRatio(baseDpr * dprScale);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };
    applySize();
    let dead = false;
    let raf = 0; // estado do loop declarado cedo: syncScroll() roda na montagem e chama requestFrame()
    let running = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.localClippingEnabled = true; // o piso corta o carro quando ele desce no elevador
    renderer.setClearColor(0x050913, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050913, 0.0175);

    const camera = new THREE.PerspectiveCamera(
      46,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      190,
    );
    camera.position.set(...CAM_WAYPOINTS[0].p);
    camera.lookAt(...CAM_WAYPOINTS[0].t);
    scene.add(camera);

    // Iluminação atmosférica noturna (azul petróleo + âmbar/esmeralda de showroom)
    scene.add(new THREE.HemisphereLight(0x3b6fd4, 0x050811, 0.65));
    const moonLight = new THREE.DirectionalLight(0x60a5fa, 0.58);
    moonLight.position.set(5, 22, -32);
    scene.add(moonLight);

    // Texturas procedurais base (céu, halo, piso de ardósia automotiva)
    const texGlow = createCanvasTexture((ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 1, w / 2, w / 2, w / 2);
      g.addColorStop(0, "rgba(255, 255, 255, 1)");
      g.addColorStop(0.24, "rgba(96, 165, 250, 0.65)");
      g.addColorStop(0.58, "rgba(37, 99, 235, 0.18)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    }, 128, 128);

    const texSky = createCanvasTexture((ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#02050b");
      g.addColorStop(0.38, "#050b18");
      g.addColorStop(0.62, "#081226");
      g.addColorStop(0.79, "#0c1b36");
      g.addColorStop(1, "#050913");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 180; i++) {
        const x = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
        const y = (Math.sin(i * 311.7) * 0.5 + 0.5) * h * 0.56;
        const a = 0.12 + (i % 7) * 0.06;
        ctx.fillStyle = `rgba(190, 215, 255, ${a})`;
        ctx.fillRect(x, y, i % 5 === 0 ? 1.8 : 1, i % 5 === 0 ? 1.8 : 1);
      }
    }, 512, 512);

    const texShowroomFloor = createCanvasTexture(
      (ctx, w, h) => {
        ctx.fillStyle = "#060b14";
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 2400; i++) {
          const v = 8 + ((i * 29) % 16);
          ctx.fillStyle = `rgba(${v}, ${v + 4}, ${v + 12}, 0.28)`;
          ctx.fillRect((i * 53) % w, (i * 97) % h, 2 + (i % 4), 2 + (i % 3));
        }
        ctx.strokeStyle = "rgba(59, 130, 246, 0.12)";
        ctx.lineWidth = 1.2;
        for (let y = 0; y < h; y += 32) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        for (let x = 0; x < w; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
      },
      256,
      256,
      true,
    );
    texShowroomFloor.repeat.set(16, 40);

    // Esfera de céu
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(145, 32, 20),
      new THREE.MeshBasicMaterial({ map: texSky, side: THREE.BackSide, fog: false }),
    );
    scene.add(sky);

    // Disco do Horizonte ("Sol de Giro" — `/landing/painel-car.jpg` no horizonte Z = -66)
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.9,
      fog: false,
    });
    const moon = new THREE.Mesh(new THREE.CircleGeometry(5.6, 64), moonMat);
    moon.position.set(2.2, 10.2, -66);
    scene.add(moon);

    const moonHaloMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      fog: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const moonHalo = new THREE.Mesh(new THREE.RingGeometry(5.5, 18.8, 64), moonHaloMat);
    moonHalo.position.copy(moon.position);
    scene.add(moonHalo);

    const moonOrbitRing = new THREE.Mesh(
      new THREE.RingGeometry(6.8, 7.02, 64),
      new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        fog: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    moonOrbitRing.position.copy(moon.position);
    scene.add(moonOrbitRing);

    // Carrega `/landing/painel-car.jpg` no Disco do Horizonte
    const moonImg = new Image();
    moonImg.src = "/landing/web/painel-car.webp";
    moonImg
      .decode()
      .then(() => {
        if (dead) return;
        const t = new THREE.CanvasTexture(buildTachometerMoonCanvas(moonImg));
        t.colorSpace = THREE.SRGBColorSpace;
        moonMat.map = t;
        moonMat.color.setHex(0xffffff);
        moonMat.needsUpdate = true;
        requestFrame();
      })
      .catch(() => {});

    // Piso molhado de showroom + corredor central reflexivo
    // Sem iluminação: o piso cobre quase a tela toda e quase não reflete; Basic poupa o shader PBR por pixel
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 240),
      new THREE.MeshBasicMaterial({ color: 0x070c18 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -38;
    scene.add(ground);

    const runway = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 96, 16, 120),
      new THREE.MeshStandardMaterial({
        map: texShowroomFloor,
        color: 0x16233b,
        roughness: 0.34,
        metalness: 0.42,
      }),
    );
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, 0.02, -26);
    scene.add(runway);

    // Trilhos luminosos laterais ao longo do corredor
    const railGeo = new THREE.PlaneGeometry(0.06, 94);
    const railMatL = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const railMatR = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
    });
    const railL = new THREE.Mesh(railGeo, railMatL);
    railL.rotation.x = -Math.PI / 2;
    railL.position.set(-2.22, 0.03, -26);
    scene.add(railL);

    const railR = new THREE.Mesh(railGeo, railMatR);
    railR.rotation.x = -Math.PI / 2;
    railR.position.set(2.22, 0.03, -26);
    scene.add(railR);

    // Portais arquitetônicos de Showroom ao longo do eixo Z (inspirado nos portais Torii de Kage)
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0x0b1324,
      roughness: 0.32,
      metalness: 0.72,
    });
    const portalAccentMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    const makeShowroomPortal = (z: number, scale = 1, yaw = 0) => {
      const g = new THREE.Group();
      const pillarGeo = new THREE.BoxGeometry(0.22 * scale, 5.4 * scale, 0.28 * scale);
      const pL = new THREE.Mesh(pillarGeo, portalMat);
      const pR = new THREE.Mesh(pillarGeo, portalMat);
      pL.position.set(-3.4 * scale, 2.7 * scale, 0);
      pR.position.set(3.4 * scale, 2.7 * scale, 0);

      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(7.8 * scale, 0.24 * scale, 0.34 * scale),
        portalMat,
      );
      beam.position.set(0, 5.35 * scale, 0);

      const lightBar = new THREE.Mesh(
        new THREE.BoxGeometry(6.6 * scale, 0.05 * scale, 0.08 * scale),
        portalAccentMat,
      );
      lightBar.position.set(0, 5.18 * scale, 0.14 * scale);

      g.add(pL, pR, beam, lightBar);
      g.position.set(0, 0, z);
      g.rotation.y = yaw;
      scene.add(g);
    };

    makeShowroomPortal(3.6, 1.0, 0.01);
    makeShowroomPortal(-4.2, 0.98, -0.015);
    makeShowroomPortal(-12.5, 0.96, 0.012);
    makeShowroomPortal(-21.8, 0.96, -0.01);
    makeShowroomPortal(-31.2, 0.94, 0.01);
    makeShowroomPortal(-41.0, 0.92, -0.01);

    // Luzes pontuais nos portais
    const pLight1 = new THREE.PointLight(0x3b82f6, 2.2, 16, 1.8);
    pLight1.position.set(-2.5, 2.8, 2.0);
    scene.add(pLight1);

    const pLight2 = new THREE.PointLight(0x10b981, 2.0, 16, 1.8);
    pLight2.position.set(2.5, 2.8, -14.0);
    scene.add(pLight2);

    const pLight3 = new THREE.PointLight(0x3b82f6, 2.2, 18, 1.8);
    pLight3.position.set(-2.2, 3.0, -30.0);
    scene.add(pLight3);

    // Ondas de radar/chuva no chão (`WORLD.ripples` do Kage)
    const ripples: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
    const rGeo = new THREE.RingGeometry(0.08, 0.13, 32);
    rGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(
        rGeo,
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x60a5fa : 0x34d399,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      m.position.set((Math.random() - 0.5) * 8, 0.04, 8 - Math.random() * 54);
      m.userData.phase = Math.random();
      m.userData.speed = 0.25 + Math.random() * 0.3;
      scene.add(m);
      ripples.push(m);
    }

    // Planos 3D com todas as imagens de `public/landing` + GLSL Shader + Proximity Dissolve
    type PlateInstance = {
      mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
      baseX: number;
      baseY: number;
      baseZ: number;
      baseRotY: number;
      phase: number;
    };
    const plateInstances: PlateInstance[] = [];
    const disposableTextures: THREE.Texture[] = [texGlow, texSky, texShowroomFloor];

    WORLD_PLATES.forEach((spec) => {
      const placeholder = new THREE.DataTexture(
        new Uint8Array([8, 14, 28, 255]),
        1,
        1,
        THREE.RGBAFormat,
      );
      placeholder.needsUpdate = true;

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: placeholder },
          uOpacity: { value: 0.85 },
          uTime: { value: 0 },
          uScrollVel: { value: 0 },
          uPhase: { value: spec.phase },
          uAccent: { value: new THREE.Vector3(...spec.accent) },
        },
        vertexShader: PLATE_VERT,
        fragmentShader: PLATE_FRAG,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const geo = new THREE.PlaneGeometry(spec.w, spec.h, 24, 18);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.rotation.y = spec.rotY;
      scene.add(mesh);

      plateInstances.push({
        mesh,
        baseX: spec.x,
        baseY: spec.y,
        baseZ: spec.z,
        baseRotY: spec.rotY,
        phase: spec.phase,
      });

      // decode() decodifica fora da thread principal; a placa fica no placeholder até a foto chegar
      const img = new Image();
      img.src = spec.src;
      img
        .decode()
        .then(() => {
          if (dead) return;
          const tex = new THREE.CanvasTexture(buildWorldPlateCanvas(img, spec));
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          mat.uniforms.uMap.value = tex;
          disposableTextures.push(tex);
          placeholder.dispose();
          requestFrame();
        })
        .catch(() => {});
    });

    // Carro da loja (`/3D/car-3d.glb`) no centro do hero, girando num ponto de luz no eixo do corredor.
    // Ao sair do hero ele desce pelo piso (elevador de showroom) antes de a câmera passar por cima.
    // Fica fora do tier baixo (313 mil triângulos, 4,5 MB); loaders vêm por import() depois do 1º frame.
    const carYaw = -0.65;
    const carPad = new THREE.Group();
    carPad.position.set(0, 0, 0.2);
    scene.add(carPad);
    let car: THREE.Object3D | null = null;
    const CAR_SCALE = 2.6; // um pouco acima do tamanho real: é o objeto do hero
    const CAR_FLOOR_Y = 0.3616 * CAR_SCALE + 0.01; // pneus no piso (caixa Y do modelo: ±0,3616)
    const floorClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // mantém só o que está acima do piso

    const padRing = new THREE.Mesh(
      new THREE.RingGeometry(2.35, 2.42, 96),
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.y = 0.035;
    const padGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 6.4),
      new THREE.MeshBasicMaterial({
        map: texGlow,
        color: 0x2563eb,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    padGlow.rotation.x = -Math.PI / 2;
    padGlow.position.y = 0.03;
    carPad.add(padGlow, padRing);

    // Luz de showroom só para o carro: spot de cima (também acende o piso em volta) e contorno azul atrás
    const carKey = new THREE.SpotLight(0xe0ecff, 90, 16, 0.5, 0.65, 2);
    carKey.position.set(0.6, 7.5, 2.2);
    carKey.target.position.set(0, 0.6, 0);
    const carRim = new THREE.PointLight(0x60a5fa, 40, 10, 2);
    carRim.position.set(0, 2.4, -2.6);
    carPad.add(carKey, carKey.target, carRim);

    const loadCar = async () => {
      let loaders;
      try {
        loaders = await Promise.all([
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/loaders/DRACOLoader.js"),
        ]);
      } catch {
        return; // chunk não carregou (offline, deploy novo): segue sem carro, sem erro no console
      }
      if (dead) return;
      const [{ GLTFLoader }, { DRACOLoader }] = loaders;
      const draco = new DRACOLoader().setDecoderPath("/3D/draco/");
      try {
        const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync("/3D/car-3d.glb");
        if (dead) {
          disposeTree(gltf.scene);
          return;
        }
        const model = gltf.scene;
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          // A textura emissiva é a luz "assada" do modelo: dosada, ela dá volume sem estourar na cena noturna
          mat.emissiveIntensity = 0.7;
          mat.metalnessMap = null;
          mat.metalness = 0.3;
          mat.side = THREE.FrontSide;
          mat.clippingPlanes = [floorClip];
          mat.needsUpdate = true;
        });
        model.scale.setScalar(CAR_SCALE);
        model.position.y = CAR_FLOOR_Y;
        model.rotation.y = carYaw;
        carPad.add(model);
        car = model;
        requestFrame();
      } catch {
        // sem carro: o ponto de luz vazio continua coerente com a cena
      } finally {
        draco.dispose(); // encerra os workers do Draco
      }
    };

    // Partículas flutuantes no corredor (`WORLD.embers` do Kage)
    const emberCount = 240;
    const emberPos = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      emberPos[i * 3] = (Math.random() - 0.5) * 32;
      emberPos[i * 3 + 1] = 0.3 + Math.random() * 11;
      emberPos[i * 3 + 2] = 12 - Math.random() * 68;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute("position", new THREE.BufferAttribute(emberPos, 3));
    const emberMat = new THREE.PointsMaterial({
      size: 0.24,
      map: texGlow,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    scene.add(embers);

    // Rastro de luz 3D no cursor acoplado à câmera (`WISP` de MengTo/kage)
    const wispGroup = new THREE.Group();
    const wispHeadMat = new THREE.SpriteMaterial({
      map: texGlow,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const wispHead = new THREE.Sprite(wispHeadMat);
    wispHead.scale.setScalar(0.32);
    wispGroup.add(wispHead);

    const wispTrails: THREE.Sprite[] = [];
    const wispTrailPos: THREE.Vector3[] = [];
    for (let i = 0; i < 5; i++) {
      const k = 1 - (i + 1) / 6;
      const sm = new THREE.SpriteMaterial({
        map: texGlow,
        color: i % 2 === 0 ? 0x3b82f6 : 0x34d399,
        transparent: true,
        opacity: 0.22 * k,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      });
      const s = new THREE.Sprite(sm);
      s.scale.setScalar(0.24 * k + 0.05);
      wispGroup.add(s);
      wispTrails.push(s);
      wispTrailPos.push(new THREE.Vector3(0, 0, -3.2));
    }
    camera.add(wispGroup);

    // Splines Catmull-Rom 3D para posição e alvo da câmera
    const curveP = new THREE.CatmullRomCurve3(
      CAM_WAYPOINTS.map((k) => new THREE.Vector3(...k.p)),
      false,
      "catmullrom",
      0.42,
    );
    const curveT = new THREE.CatmullRomCurve3(
      CAM_WAYPOINTS.map((k) => new THREE.Vector3(...k.t)),
      false,
      "catmullrom",
      0.42,
    );

    const rig = {
      cur: 0,
      to: 0,
      intro: reduceMotion ? 1 : 0,
      mx: 0,
      my: 0,
      tmx: 0,
      tmy: 0,
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      wispCur: new THREE.Vector3(0, 0, -3.2),
      wispTo: new THREE.Vector3(0, 0, -3.2),
      scrollVel: 0,
      lastScrollY: window.scrollY,
    };

    const sampleFov = (u: number) => {
      const s = clamp(u, 0, 1) * (CAM_WAYPOINTS.length - 1);
      const i = Math.min(Math.floor(s), CAM_WAYPOINTS.length - 2);
      return lerp(CAM_WAYPOINTS[i].fov, CAM_WAYPOINTS[i + 1].fov, s - i);
    };

    const fitAspect = (baseFov: number) => {
      const a = camera.aspect;
      if (a >= 1.15) return baseFov;
      const rad = (baseFov * Math.PI) / 180;
      const scaled = 2 * Math.atan(Math.tan(rad * 0.5) * Math.pow(1.15 / Math.max(a, 0.42), 0.52));
      return Math.min(72, (scaled * 180) / Math.PI);
    };

    let sectionCenters: number[] = [];
    const measureSections = () => {
      const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-cam]"));
      const sy = window.scrollY;
      sectionCenters = secs.map((s) => {
        const r = s.getBoundingClientRect();
        return r.top + sy + Math.min(r.height * 0.35, window.innerHeight * 0.5);
      });
    };

    const progressFor = (y: number) => {
      const c = y + window.innerHeight * 0.5;
      const m = sectionCenters;
      if (!m.length) {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        return clamp(y / max, 0, 1);
      }
      if (c <= m[0]) return 0;
      const n = m.length - 1;
      if (c >= m[n]) return 1;
      for (let i = 0; i < n; i++) {
        if (c >= m[i] && c <= m[i + 1]) {
          const span = Math.max(1, m[i + 1] - m[i]);
          return (i + (c - m[i]) / span) / n;
        }
      }
      return 0;
    };

    let currentCamIdx = 0;
    const syncScroll = () => {
      const sy = window.scrollY;
      const dy = sy - rig.lastScrollY;
      rig.lastScrollY = sy;
      rig.scrollVel = clamp(rig.scrollVel * 0.7 + dy * 0.04, -3.5, 3.5);
      rig.to = progressFor(sy);
      updateHeroExit();

      const idx = Math.round(rig.to * (CAM_WAYPOINTS.length - 1));
      if (idx !== currentCamIdx) {
        currentCamIdx = idx;
        setActiveCam(idx);
      }
      requestFrame(); // no modo reduzido não há loop: cada scroll pede um frame
    };

    measureSections();
    syncScroll();
    rig.cur = rig.to;

    const onResize = () => {
      applySize();
      camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      camera.updateProjectionMatrix();
      measureSections();
      syncScroll();
    };

    const onPointerMove = (e: PointerEvent) => {
      rig.tmx = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      rig.tmy = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    };

    window.addEventListener("scroll", syncScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const ro = new ResizeObserver(() => {
      measureSections();
      syncScroll();
    });
    ro.observe(document.body);

    const timer = new THREE.Timer();
    let shown = false;
    let warmup = 90; // ignora os primeiros frames (compilação de shader, upload do carro) na adaptação de DPR
    let frameAcc = 0;
    let frameN = 0;
    let lastDropAt = 0;

    const tick = (now: number) => {
      timer.update(now);
      const rawDt = timer.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const t = reduceMotion ? 0 : timer.getElapsed();

      if (reduceMotion) {
        rig.cur = rig.to; // segue o scroll sem amortecer, sem parallax do cursor
        rig.scrollVel = 0;
      } else {
        rig.cur = damp(rig.cur, rig.to, 4.2, dt);
        rig.mx = damp(rig.mx, rig.tmx, 2.8, dt);
        rig.my = damp(rig.my, rig.tmy, 2.8, dt);
        rig.scrollVel = damp(rig.scrollVel, 0, 5.5, dt);
      }

      curveP.getPointAt(clamp(rig.cur, 0, 1), rig.pos);
      curveT.getPointAt(clamp(rig.cur, 0, 1), rig.look);

      if (rig.intro < 1) {
        rig.intro = Math.min(1, rig.intro + dt * 0.48);
        const k = 1 - cubicOut(rig.intro);
        rig.pos.z += k * 3.8;
        rig.pos.y += k * 0.72;
      }

      if (camera.aspect < 1) {
        rig.pos.z += (1 - camera.aspect) * 2.4;
      }

      const swayX = Math.sin(t * 0.35) * 0.07 + rig.mx * 0.38;
      const swayY = Math.cos(t * 0.28) * 0.04 - rig.my * 0.22;

      camera.position.set(rig.pos.x + swayX, rig.pos.y + swayY, rig.pos.z);
      camera.lookAt(rig.look.x + rig.mx * 0.65, rig.look.y - rig.my * 0.4, rig.look.z);

      const targetFov = fitAspect(sampleFov(rig.cur));
      if (Math.abs(camera.fov - targetFov) > 0.02) {
        camera.fov = damp(camera.fov, targetFov, 5, dt);
        camera.updateProjectionMatrix();
      }

      // Atualiza WISP 3D no espaço da câmera
      const dist = 3.2;
      const vH = Math.tan((camera.fov * Math.PI) / 360) * dist;
      const vW = vH * camera.aspect;
      rig.wispTo.set(
        rig.tmx * vW * 0.85 + Math.sin(t * 1.3) * 0.04,
        -rig.tmy * vH * 0.82 + Math.cos(t * 1.1) * 0.04,
        -dist,
      );
      rig.wispCur.lerp(rig.wispTo, 1 - Math.exp(-9 * dt));
      wispHead.position.copy(rig.wispCur);
      wispHead.scale.setScalar(0.32 + Math.sin(t * 3.8) * 0.03);

      let prev = rig.wispCur;
      for (let i = 0; i < wispTrails.length; i++) {
        wispTrailPos[i].lerp(prev, 1 - Math.exp(-(13 - i * 1.6) * dt));
        wispTrails[i].position.copy(wispTrailPos[i]);
        prev = wispTrailPos[i];
      }

      // Atualiza os planos 3D de `public/landing` com dissolução por proximidade (Kage technique)
      for (let i = 0; i < plateInstances.length; i++) {
        const inst = plateInstances[i];
        const m = inst.mesh;
        const dz = camera.position.z - inst.baseZ;
        // Dissolve suave conforme a câmera chega perto (dz < 4.4) ou quando está muito longe (> 38)
        const nearFade = smooth(0.85, 4.4, dz);
        const farFade = 1 - smooth(28.0, 44.0, Math.abs(dz));
        const op = nearFade * farFade * 0.88;

        m.material.uniforms.uOpacity.value = op;
        m.material.uniforms.uTime.value = t;
        m.material.uniforms.uScrollVel.value = rig.scrollVel;

        m.position.y = inst.baseY + Math.sin(t * 0.85 + inst.phase) * 0.08;
        m.rotation.y = inst.baseRotY + rig.mx * 0.04;
      }

      // Partículas e ondas são movimento por tempo: paradas no modo reduzido
      const motionDt = reduceMotion ? 0 : dt;

      // Atualiza partículas de luz
      if (motionDt > 0) {
        const posAttr = emberGeo.getAttribute("position") as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < emberCount; i++) {
          arr[i * 3 + 1] += motionDt * (0.14 + (i % 7) * 0.02);
          arr[i * 3] += Math.sin(t * 0.5 + i) * motionDt * 0.04;
          if (arr[i * 3 + 1] > 11.5) arr[i * 3 + 1] = 0.3;
        }
        posAttr.needsUpdate = true;
      }

      // Atualiza ondas de radar no piso
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        r.userData.phase = (r.userData.phase + motionDt * r.userData.speed) % 1;
        const p = r.userData.phase as number;
        r.scale.setScalar(0.5 + p * 4.5);
        r.material.opacity = (1 - p) * (1 - p) * 0.32;
      }

      // Pulso do horizonte (`painel-car.webp`)
      moonHalo.scale.setScalar(1 + Math.sin(t * 0.9) * 0.03);
      moonOrbitRing.rotation.z = t * 0.14;

      // Carro girando devagar; o scroll dá um leve empurrão no giro
      // Elevador: entre 1,5% e 10% do percurso (metade da saída do hero) o carro afunda pelo piso e some;
      // escondido, os 313 mil triângulos saem do render no resto da página
      const sink = smooth(0.015, 0.1, rig.cur);
      if (car) {
        car.visible = sink < 0.999;
        car.position.y = CAR_FLOOR_Y - sink * 2.1;
        car.rotation.y = carYaw + t * 0.12 + rig.scrollVel * 0.03;
      }
      padRing.material.opacity = (0.42 + Math.sin(t * 1.6) * 0.14) * (1 - sink * 0.75);
      padGlow.material.opacity = 0.5 * (1 - sink * 0.75);

      renderer.render(scene, camera);

      if (!shown) {
        shown = true;
        canvas.style.opacity = "0.9"; // o pôster some por baixo do primeiro frame
        if (tier !== "baixo") {
          const run = () => void loadCar();
          if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 2500 });
          else setTimeout(run, 1200);
        }
      }

      // Escala adaptativa de resolução (média de 45 frames): acima de 24 ms baixa 15%; abaixo de 18,5 ms
      // sobe 5%, só 3 s depois da última queda. 18,5 ms é alcançável a 60 Hz (rAF ~16,7 ms) e a faixa
      // 18,5–24 ms segura a escala sem oscilar (cada mudança realoca o buffer do canvas).
      if (running) {
        if (warmup > 0) warmup--;
        else {
          frameAcc += Math.min(rawDt, 0.1);
          if (++frameN >= 45) {
            const avg = frameAcc / frameN;
            frameAcc = 0;
            frameN = 0;
            let next = dprScale;
            if (avg > 0.024) next = Math.max(0.6, dprScale * 0.85);
            else if (avg < 0.0185 && now - lastDropAt > 3000) next = Math.min(1, dprScale + 0.05);
            if (next !== dprScale) {
              if (next < dprScale) lastDropAt = now;
              dprScale = next;
              applySize();
            }
          }
        }
      }
    };

    function loop(now: number) {
      raf = 0;
      tick(now);
      if (running) raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduceMotion || dead || document.hidden) return;
      running = true;
      timer.reset();
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    }
    /** Um frame avulso (modo reduzido, textura que chegou). Com o loop rodando não faz nada. */
    function requestFrame() {
      if (!raf && !dead) raf = requestAnimationFrame(loop);
    }

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (reduceMotion) requestFrame(); // stop() cancelou o frame avulso pendente; redesenha ao voltar
      else start();
    };
    const onContextLost = (e: Event) => {
      e.preventDefault(); // permite o restore; até lá o pôster aparece
      stop();
      canvas.style.opacity = "0";
    };
    const onContextRestored = () => {
      canvas.style.opacity = "0.9";
      if (reduceMotion) requestFrame();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    wispGroup.visible = !reduceMotion;
    if (reduceMotion) requestFrame();
    else start();

    return () => {
      dead = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      window.removeEventListener("scroll", syncScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      ro.disconnect();
      disposeTree(scene);
      disposableTextures.forEach((tex) => tex.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  const scrollToCam = (idx: number) => {
    const el = document.querySelector<HTMLElement>(`[data-cam="${idx}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Pôster: aparece antes do 1º frame e quando não há WebGL (mesma foto da 1ª placa, já em cache) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(5, 9, 19, 0.72), rgba(5, 9, 19, 0.9)), url(/landing/web/garagem.webp)",
        }}
      />
      {/* O canvas WebGL fixo em tela cheia (`#gl` de MengTo/kage) é criado no efeito, dentro deste host */}
      <div ref={hostRef} aria-hidden="true" />

      {/* Vinheta radial e granulação sutil (`#vignette` de MengTo/kage) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-1"
        style={{
          background:
            "radial-gradient(ellipse 92% 78% at 50% 45%, rgba(5, 9, 19, 0.18) 0%, rgba(5, 9, 19, 0.56) 68%, rgba(3, 6, 14, 0.88) 100%)",
        }}
      />

      {/* Rail lateral de progresso dos 6 capítulos 3D (`.rail` de MengTo/kage) */}
      <aside
        aria-label="Capítulos da câmera 3D"
        className="kage-rail fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col items-end gap-2.5 lg:flex"
      >
        {CAM_WAYPOINTS.map((wp, idx) => {
          const isCurrent = activeCam === idx;
          return (
            <button
              key={wp.code}
              type="button"
              onClick={() => scrollToCam(idx)}
              title={wp.label}
              aria-label={`Ir para capítulo ${wp.code}: ${wp.label}`}
              className={`group flex items-center gap-2.5 py-0.5 text-right transition-all ${
                isCurrent ? "opacity-100" : "opacity-45 hover:opacity-85"
              }`}
            >
              <span
                className={`font-mono text-[10px] tracking-[0.2em] uppercase transition-all ${
                  isCurrent
                    ? "translate-x-0 text-white"
                    : "translate-x-1 text-ink-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {wp.code} · {wp.label.split("·")[1]?.trim() ?? wp.label}
              </span>
              <span
                className={`block h-[1.5px] rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "w-7 bg-signal shadow-[0_0_10px_#34d399]"
                    : "w-3.5 bg-white/40 group-hover:w-5 group-hover:bg-white/75"
                }`}
              />
            </button>
          );
        })}
      </aside>
    </>
  );
}
