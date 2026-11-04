"use client";

import { useEffect, useRef, useState } from "react";
import { DPR_MAX, tierDoNavegador } from "@/lib/landing-tier";

export type KageGlowSpot = {
  x: string;
  y: string;
  radius: string;
  duration1: string;
  duration2: string;
  color1: string;
  color2: string;
  flame?: boolean;
};

export type KageClothCardProps = {
  imageSrc: string;
  eyebrow: string;
  code: string;
  title: string;
  subtitle: string;
  metaLeft: string;
  metaRight: string;
  glows?: KageGlowSpot[];
  featured?: boolean;
  aspectClass?: string;
  onSelect?: () => void;
  active?: boolean;
};

const CLOTH_VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aGrid;
layout(location = 1) in vec4 aData;
layout(location = 2) in vec2 aOffset;
uniform vec2 uRes;
uniform vec2 uOut;
uniform float uBleed;
uniform float uFocal;
out vec2 vUv;
out vec3 vNormal;
out float vFold;
out vec2 vLocal;
void main () {
  vUv = aGrid;
  float z = aData.x;
  vec2 nxy = aData.yz;
  vNormal = vec3(nxy, sqrt(max(1.0 - dot(nxy, nxy), 0.04)));
  vFold = aData.w;
  vLocal = aGrid * uRes;
  vec2 px = vLocal + aOffset + vec2(uBleed);
  vec2 ndc = (px / uOut) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  float w = (uFocal - z) / uFocal;
  gl_Position = vec4(ndc, -z / uFocal, w);
}`;

const CLOTH_SDF = /* glsl */ `
float fabricDist (vec2 p, vec2 size, float radius) {
  vec2 half_ = size * 0.5;
  float r = min(radius, min(half_.x, half_.y));
  vec2 q = abs(p - half_) - (half_ - vec2(r));
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}`;

const CLOTH_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vNormal;
in float vFold;
in vec2 vLocal;
out vec4 outColor;
uniform sampler2D uContent;
uniform float uMaxX;
uniform float uLight;
uniform float uSheen;
uniform vec3 uBacking;
uniform vec2 uRes;
uniform float uRadius;
uniform float uDark;
uniform float uEdge;
${CLOTH_SDF}
void main () {
  vec2 uv = clamp(vUv, vec2(0.001), vec2(uMaxX - 0.001, 0.999));
  vec4 tex = texture(uContent, uv);
  vec3 fabric = mix(uBacking, tex.rgb, tex.a);
  vec3 n = normalize(vNormal);
  vec3 lightDir = normalize(vec3(-0.3, 0.42, 0.86));
  float diffFlat = 0.58 + 0.42 * lightDir.z;
  float diff = 0.58 + 0.42 * dot(n, lightDir);
  float shade = mix(1.0, (diff / diffFlat) * vFold, uLight);
  vec3 lit = fabric * shade;
  vec3 halfway = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float specFlat = pow(halfway.z, 34.0);
  float spec = max(pow(max(dot(n, halfway), 0.0), 34.0) - specFlat, 0.0) / (1.0 - specFlat);
  lit += uSheen * spec * mix(vec3(1.0), fabric, 0.35);
  float broadFlat = pow(halfway.z, 6.0);
  float broad = max(pow(max(dot(n, halfway), 0.0), 6.0) - broadFlat, 0.0) / (1.0 - broadFlat);
  lit += uDark * uLight * 0.3 * broad * vec3(0.45, 0.72, 1.0);
  float d = fabricDist(vLocal, uRes, uRadius);
  float hemT = smoothstep(0.0, 6.0, -d);
  lit *= mix(1.0, mix(0.93, 1.0, hemT), uLight * (1.0 - uDark));
  lit += vec3(uDark * uLight * 0.08 * (1.0 - hemT));
  float rim = smoothstep(1.15, 0.2, abs(d + 0.7));
  lit += rim * uEdge * vec3(0.55, 0.78, 1.0);
  float alpha = clamp(0.5 - d, 0.0, 1.0);
  outColor = vec4(clamp(lit, 0.0, 1.0), 1.0) * alpha;
}`;

const CLOTH_SHADOW_VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aGrid;
layout(location = 1) in vec4 aData;
layout(location = 2) in vec2 aOffset;
uniform vec2 uRes;
uniform vec2 uOut;
uniform float uBleed;
out vec2 vLocal;
out float vLift;
void main () {
  float z = aData.x;
  vLift = z;
  vLocal = aGrid * uRes;
  vec2 px = vLocal + aOffset + vec2(uBleed) + vec2(10.0, 14.0) + vec2(0.3, 0.42) * z;
  vec2 ndc = (px / uOut) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;

const CLOTH_SHADOW_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vLocal;
in float vLift;
out vec4 outColor;
uniform float uShadow;
uniform vec2 uRes;
uniform float uRadius;
uniform float uDark;
${CLOTH_SDF}
void main () {
  float d = fabricDist(vLocal, uRes, uRadius);
  float a = uShadow * smoothstep(0.0, 28.0, -d);
  a *= mix(1.0, 0.55, clamp(vLift / 50.0, 0.0, 1.0));
  a *= mix(1.0, 0.55, uDark);
  outColor = vec4(vec3(0.02, 0.04, 0.08) * a, a);
}`;

const CL_SEG = 64;
const CL_NODES = CL_SEG + 1;
const CL_DT = 1 / 120;
const CL_WAVE = 30;
const CL_STIFF = 0.55;
const CL_GAIN = 5.0;
const CL_BLEED = 36;

function buildClothPlate(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.min(1280, w | 0));
  c.height = Math.max(1, Math.min(1280, h | 0));
  const x = c.getContext("2d");
  if (!x) return c;
  const s = Math.max(c.width / Math.max(1, img.naturalWidth), c.height / Math.max(1, img.naturalHeight));
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  x.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);

  let g = x.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, "rgba(4, 8, 16, 0.18)");
  g.addColorStop(0.38, "rgba(4, 8, 16, 0.04)");
  g.addColorStop(1, "rgba(4, 8, 16, 0.78)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);

  g = x.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0.48, "rgba(4, 7, 14, 0)");
  g.addColorStop(1, "rgba(4, 7, 14, 0.84)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

/**
 * Cartão 3D inspirado diretamente no sistema `createCloth` + `.glow` de MengTo/kage:
 * Renderiza a fotografia de `public/landing` em uma malha WebGL2 de tecido/placa 3D
 * que ondula com o scroll e reage fisicamente ao toque/cursor com iluminação especular,
 * dobras em perspectiva e pontos de luz pulsantes (`.kage-glow`).
 */
export function KageClothCard({
  imageSrc,
  eyebrow,
  code,
  title,
  subtitle,
  metaLeft,
  metaRight,
  glows = [],
  featured = false,
  aspectClass = "aspect-[4/5]",
  onSelect,
  active = false,
}: KageClothCardProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [clothReady, setClothReady] = useState(false);
  const [near, setNear] = useState(false);
  const edgeBaseRef = useRef(0.065);
  const edgeTargetRef = useRef(0.065);

  useEffect(() => {
    edgeBaseRef.current = active ? 0.24 : 0.065;
    edgeTargetRef.current = edgeBaseRef.current;
  }, [active]);

  // O contexto WebGL só nasce quando o card chega perto da tela (contrato: docs/landing-3d.md)
  useEffect(() => {
    const el = frameRef.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), { rootMargin: "300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    const wrapper = frameRef.current;
    if (!wrapper || !near) return;

    // Tecido só com mouse (tier alto) e sem movimento reduzido; senão fica a foto com os glows CSS
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isHeadless = typeof navigator !== "undefined" && navigator.webdriver;
    if (reduceMotion || isHeadless || tierDoNavegador() !== "alto") return;

    // Canvas criado aqui para o contexto morrer junto no desmonte (StrictMode/HMR não acumulam contextos)
    const output = document.createElement("canvas");
    output.setAttribute("aria-hidden", "true");
    output.className = "pointer-events-none absolute z-1";
    Object.assign(output.style, {
      top: `${-CL_BLEED}px`,
      left: `${-CL_BLEED}px`,
      width: `calc(100% + ${CL_BLEED * 2}px)`,
      height: `calc(100% + ${CL_BLEED * 2}px)`,
      opacity: "0",
    });

    const gl = output.getContext("webgl2", {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
    });
    if (!gl || gl.isContextLost()) return;
    wrapper.prepend(output);
    const dprCap = DPR_MAX.alto;

    let dead = false;
    let running = false;
    let visible = false;
    let raf = 0;

    const compile = (type: number, text: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, text);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const link = (v: string, f: string) => {
      const prog = gl.createProgram();
      const vs = compile(gl.VERTEX_SHADER, v);
      const fs = compile(gl.FRAGMENT_SHADER, f);
      if (!prog || !vs || !fs) return null;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
      const u: Record<string, WebGLUniformLocation | null> = {};
      const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(prog, i);
        if (info) u[info.name] = gl.getUniformLocation(prog, info.name);
      }
      return { program: prog, vs, fs, uniforms: u };
    };

    const cloth = link(CLOTH_VERT, CLOTH_FRAG);
    const shadow = link(CLOTH_SHADOW_VERT, CLOTH_SHADOW_FRAG);
    if (!cloth || !shadow) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      output.remove();
      return;
    }

    const gridVerts = new Float32Array(CL_NODES * CL_NODES * 2);
    for (let y = 0; y < CL_NODES; y++) {
      for (let x = 0; x < CL_NODES; x++) {
        const i = (y * CL_NODES + x) * 2;
        gridVerts[i] = x / CL_SEG;
        gridVerts[i + 1] = y / CL_SEG;
      }
    }

    const idx = new Uint32Array(CL_SEG * CL_SEG * 6);
    let o = 0;
    for (let y = 0; y < CL_SEG; y++) {
      for (let x = 0; x < CL_SEG; x++) {
        const a = y * CL_NODES + x;
        const b = a + 1;
        const c = a + CL_NODES;
        const d = c + 1;
        idx[o++] = a;
        idx[o++] = c;
        idx[o++] = b;
        idx[o++] = b;
        idx[o++] = c;
        idx[o++] = d;
      }
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const gridBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
    gl.bufferData(gl.ARRAY_BUFFER, gridVerts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const dataBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuf);
    gl.bufferData(gl.ARRAY_BUFFER, CL_NODES * CL_NODES * 16, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

    const offBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, offBuf);
    gl.bufferData(gl.ARRAY_BUFFER, CL_NODES * CL_NODES * 8, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([8, 13, 24, 255]),
    );

    let loadedImg: HTMLImageElement | null = null;
    let cachedPlate: HTMLCanvasElement | null = null;
    let pw = 0;
    let ph = 0;

    // Tamanhos lidos só no ResizeObserver; o loop usa o cache e não força layout a cada frame
    let cardW = Math.max(wrapper.clientWidth, 1);
    let cardH = Math.max(wrapper.clientHeight, 1);

    function syncSize() {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = Math.max(1, Math.round((cardW + CL_BLEED * 2) * dpr));
      const h = Math.max(1, Math.round((cardH + CL_BLEED * 2) * dpr));
      if (output.width !== w || output.height !== h) {
        output.width = w;
        output.height = h;
      }
    }

    function uploadTexture() {
      if (!loadedImg || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = Math.round(cardW * dpr);
      const h = Math.round(cardH * dpr);
      if (!cachedPlate || w !== pw || h !== ph) {
        cachedPlate = buildClothPlate(loadedImg, w, h);
        pw = w;
        ph = h;
      }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cachedPlate);
    }

    let hCur = new Float32Array(CL_NODES * CL_NODES);
    let hPrev = new Float32Array(CL_NODES * CL_NODES);
    let hNext = new Float32Array(CL_NODES * CL_NODES);
    const vData = new Float32Array(CL_NODES * CL_NODES * 4);
    const oData = new Float32Array(CL_NODES * CL_NODES * 2);
    const zF = new Float32Array(CL_NODES * CL_NODES);
    const rowF = new Float32Array(CL_NODES);
    const colF = new Float32Array(CL_NODES);
    const hang = new Float32Array(CL_NODES);
    for (let a = 0; a < CL_NODES; a++) hang[a] = Math.pow(a / CL_SEG, 1.3);

    let simTime = Math.random() * 40;
    let gust = 0.52;
    let edge = 0.065;
    let scrollBoost = 0;
    let lastScrollY = window.scrollY;

    const ptr = { x: -1e5, y: -1e5, inside: false };
    const touch = { x: -1e5, y: -1e5, vx: 0, vy: 0, s: 0 };

    function stepSim(dt: number) {
      simTime += dt * 0.55;
      const t = simTime;
      const windAmp = CL_GAIN * (2.6 + scrollBoost * 3.5) * gust;
      const kb1 = (Math.PI * 2) / (CL_SEG / 1.5);
      const kb2 = (Math.PI * 2) / (CL_SEG / 3.8);
      const ka = (Math.PI * 2) / (CL_SEG / 2.2);
      const w1 = CL_WAVE * kb1;
      const w2 = CL_WAVE * kb2;
      const drift = 1.8 * Math.sin(0.23 * t);

      for (let b = 0; b < CL_NODES; b++) {
        rowF[b] = Math.sin(kb1 * b - w1 * t + drift) + 0.45 * Math.sin(kb2 * b + w2 * t * 0.8 + 3);
      }
      for (let a = 0; a < CL_NODES; a++) {
        colF[a] = (0.7 + 0.3 * Math.sin(ka * a - 1.7 * t)) * hang[a];
      }

      const c2 = CL_WAVE * CL_WAVE;
      const dt2 = dt * dt;
      const decay = Math.exp(-1.05 * dt);

      for (let y = 0; y < CL_NODES; y++) {
        const up = Math.max(y - 1, 0) * CL_NODES;
        const down = Math.min(y + 1, CL_SEG) * CL_NODES;
        const row = y * CL_NODES;
        for (let x = 0; x < CL_NODES; x++) {
          const i = row + x;
          const h = hCur[i];
          const lap =
            hCur[row + Math.max(x - 1, 0)] +
            hCur[row + Math.min(x + 1, CL_SEG)] +
            hCur[up + x] +
            hCur[down + x] -
            4 * h;
          const force = windAmp * rowF[x] * colF[y];
          const next = 2 * h - hPrev[i] + dt2 * (c2 * lap - CL_STIFF * h + force);
          let v = h + (next - h) * decay;
          if (v > 3.5) v = 3.5;
          else if (v < -3.5) v = -3.5;
          hNext[i] = v;
        }
      }
      for (let b = 0; b < CL_NODES; b++) {
        hNext[b] = 0;
      }
      const spent = hPrev;
      hPrev = hCur;
      hCur = hNext;
      hNext = spent;
    }

    function imprint(delta: number, width: number, height: number) {
      if (touch.s < 0.01) return;
      const cw = width / CL_SEG;
      const ch = height / CL_SEG;
      const rx = 140 / cw;
      const ry = 140 / ch;
      const gx = touch.x / cw;
      const gy = touch.y / ch;
      const x0 = Math.max(Math.ceil(gx - 2.5 * rx), 0);
      const x1 = Math.min(Math.floor(gx + 2.5 * rx), CL_SEG);
      const y0 = Math.max(Math.ceil(gy - 2.5 * ry), 0);
      const y1 = Math.min(Math.floor(gy + 2.5 * ry), CL_SEG);
      const lift = 2.2 * touch.s;
      const rate = Math.min(delta * 4, 1);

      for (let y = y0; y <= y1; y++) {
        const oy = (y - gy) / ry;
        const row = y * CL_NODES;
        for (let x = x0; x <= x1; x++) {
          const ox = (x - gx) / rx;
          const g = Math.exp(-(ox * ox + oy * oy));
          if (g < 0.02) continue;
          const i = row + x;
          const pull = rate * g;
          const goal = lift * g;
          hCur[i] += (goal - hCur[i]) * pull;
          hPrev[i] += (goal - hPrev[i]) * pull;
        }
      }
    }

    function foreshorten(stride: number, lineStride: number, ds: number, anchor: number, comp: number) {
      const ds2 = ds * ds;
      for (let l = 0; l < CL_NODES; l++) {
        const base = l * lineStride;
        oData[(base + anchor * stride) * 2 + comp] = 0;
        let cum = 0;
        for (let k = anchor + 1; k < CL_NODES; k++) {
          const i = base + k * stride;
          const dz = zF[i] - zF[i - stride];
          cum += ds - Math.sqrt(Math.max(ds2 - dz * dz, 0));
          oData[i * 2 + comp] = -cum;
        }
        cum = 0;
        for (let k = anchor - 1; k >= 0; k--) {
          const i = base + k * stride;
          const dz = zF[i] - zF[i + stride];
          cum += ds - Math.sqrt(Math.max(ds2 - dz * dz, 0));
          oData[i * 2 + comp] = cum;
        }
      }
    }

    function compose(width: number, height: number) {
      const amp = 26;
      const drape = 34 * (0.3 + 0.7 * gust);
      const cw = width / CL_SEG;
      const ch = height / CL_SEG;

      for (let y = 0; y < CL_NODES; y++) {
        const row = y * CL_NODES;
        for (let x = 0; x < CL_NODES; x++) {
          const i = row + x;
          const h = hCur[i];
          zF[i] = amp * Math.tanh(h) + drape * hang[y];
        }
      }
      for (let y = 0; y < CL_NODES; y++) {
        const up = Math.max(y - 1, 0) * CL_NODES;
        const down = Math.min(y + 1, CL_SEG) * CL_NODES;
        const row = y * CL_NODES;
        for (let x = 0; x < CL_NODES; x++) {
          const i = row + x;
          const l = row + Math.max(x - 1, 0);
          const r = row + Math.min(x + 1, CL_SEG);
          const dzdx = (zF[r] - zF[l]) / (2 * cw);
          const dzdy = (zF[down + x] - zF[up + x]) / (2 * ch);
          const inv = 1 / Math.hypot(dzdx, dzdy, 1);
          const curve = zF[l] + zF[r] + zF[up + x] + zF[down + x] - 4 * zF[i];
          let fold = 1 - curve * 0.01;
          if (fold < 0.86) fold = 0.86;
          else if (fold > 1.06) fold = 1.06;
          const q = i * 4;
          vData[q] = zF[i];
          vData[q + 1] = -dzdx * inv;
          vData[q + 2] = -dzdy * inv;
          vData[q + 3] = fold;
        }
      }
      const mid = CL_SEG >> 1;
      foreshorten(CL_NODES, 1, ch, 0, 1);
      foreshorten(1, CL_NODES, cw, mid, 0);
    }

    function draw() {
      if (!wrapper || !output || !gl || !cloth || !shadow) return;
      const resW = cardW;
      const resH = cardH;
      const outW = cardW + CL_BLEED * 2;
      const outH = cardH + CL_BLEED * 2;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, output.width, output.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, dataBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vData);
      gl.bindBuffer(gl.ARRAY_BUFFER, offBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, oData);

      gl.useProgram(shadow.program);
      gl.uniform2f(shadow.uniforms.uRes, resW, resH);
      gl.uniform2f(shadow.uniforms.uOut, outW, outH);
      gl.uniform1f(shadow.uniforms.uBleed, CL_BLEED);
      gl.uniform1f(shadow.uniforms.uShadow, 0.28);
      gl.uniform1f(shadow.uniforms.uRadius, 12);
      gl.uniform1f(shadow.uniforms.uDark, 1.0);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);

      gl.useProgram(cloth.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(cloth.uniforms.uContent, 0);
      gl.uniform2f(cloth.uniforms.uRes, resW, resH);
      gl.uniform2f(cloth.uniforms.uOut, outW, outH);
      gl.uniform1f(cloth.uniforms.uBleed, CL_BLEED);
      gl.uniform1f(cloth.uniforms.uFocal, 1150);
      gl.uniform1f(cloth.uniforms.uMaxX, 1);
      gl.uniform1f(cloth.uniforms.uLight, 0.55);
      gl.uniform1f(cloth.uniforms.uSheen, 0.14);
      gl.uniform1f(cloth.uniforms.uRadius, 12);
      gl.uniform1f(cloth.uniforms.uDark, 1.0);
      gl.uniform1f(cloth.uniforms.uEdge, edge);
      gl.uniform3f(cloth.uniforms.uBacking, 0.03, 0.05, 0.09);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
      gl.bindVertexArray(null);
    }

    let last = performance.now();
    let debt = 0;
    let lastActive = performance.now();
    const IDLE_MS = 1500; // sem cursor e sem scroll por 1,5 s, o tecido congela e o loop para

    function frame(now: number) {
      if (dead || !visible) {
        running = false;
        return;
      }
      const delta = Math.min((now - last) / 1000, 1 / 20);
      last = now;

      const curScroll = window.scrollY;
      const dy = Math.abs(curScroll - lastScrollY);
      lastScrollY = curScroll;
      scrollBoost = Math.min(1.5, scrollBoost * 0.9 + (dy / 120));
      if (dy > 0 || ptr.inside) lastActive = now;

      const width = cardW;
      const height = cardH;

      const t = simTime;
      const target = Math.max(
        0.52 + 0.35 * Math.sin(t * 0.31 + 1.3) + 0.25 * Math.sin(t * 0.83) * (0.5 + 0.5 * Math.sin(t * 0.17)),
        0.18,
      );
      gust += (target - gust) * Math.min(delta * 2, 1);

      const sT = ptr.inside ? 1 : 0;
      touch.s += (sT - touch.s) * Math.min(delta * (ptr.inside ? 8 : 2.5), 1);
      const om = 14;
      touch.vx += ((ptr.x - touch.x) * om * om - 2 * om * touch.vx) * delta;
      touch.vy += ((ptr.y - touch.y) * om * om - 2 * om * touch.vy) * delta;
      touch.x += touch.vx * delta;
      touch.y += touch.vy * delta;
      imprint(delta, width, height);

      edge += (edgeTargetRef.current - edge) * Math.min(delta * 5, 1);
      debt = Math.min(debt + delta, CL_DT * 5);
      while (debt >= CL_DT) {
        stepSim(CL_DT);
        debt -= CL_DT;
      }

      compose(width, height);
      draw();
      if (!ptr.inside && touch.s < 0.01 && now - lastActive > IDLE_MS) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (dead || running || !visible) return;
      running = true;
      last = performance.now();
      lastActive = last;
      raf = requestAnimationFrame(frame);
    }

    const img = new Image();
    img.src = imageSrc;
    img
      .decode()
      .then(() => {
        if (dead) return;
        loadedImg = img;
        syncSize();
        uploadTexture();
        compose(cardW, cardH);
        draw();
        output.style.opacity = "1";
        setClothReady(true);
        start();
      })
      .catch(() => {});

    const ro = new ResizeObserver(() => {
      cardW = Math.max(wrapper.clientWidth, 1);
      cardH = Math.max(wrapper.clientHeight, 1);
      syncSize();
      uploadTexture();
      start();
    });
    ro.observe(wrapper);

    const onScroll = () => start(); // o scroll acorda o tecido (o vento cresce com a velocidade)
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1]?.isIntersecting ?? false;
      if (visible) start();
    });
    io.observe(wrapper);

    const onMove = (e: PointerEvent) => {
      const r = wrapper.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (touch.s < 0.01) {
        touch.x = x;
        touch.y = y;
        touch.vx = 0;
        touch.vy = 0;
      }
      ptr.x = x;
      ptr.y = y;
      ptr.inside = true;
      edgeTargetRef.current = 0.28;
      start();
    };

    const onLeave = () => {
      ptr.inside = false;
      edgeTargetRef.current = edgeBaseRef.current;
    };

    wrapper.addEventListener("pointermove", onMove, { passive: true });
    wrapper.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerleave", onLeave);
      gl.deleteTexture(tex);
      gl.deleteBuffer(gridBuf);
      gl.deleteBuffer(dataBuf);
      gl.deleteBuffer(offBuf);
      gl.deleteBuffer(idxBuf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(cloth.program);
      gl.deleteProgram(shadow.program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      output.remove();
      setClothReady(false);
    };
  }, [imageSrc, near]);

  return (
    <article
      onClick={onSelect}
      className={`kage-card group relative flex flex-col ${featured ? "lg:row-span-2" : ""} ${
        onSelect ? "cursor-pointer" : ""
      }`}
    >
      <div
        ref={frameRef}
        className={`kage-card-fr relative w-full ${
          featured ? "min-h-[22rem] flex-1 lg:min-h-[36rem]" : aspectClass
        } ${clothReady ? "is-cloth" : ""}`}
        style={
          !clothReady
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(4, 8, 16, 0.08) 34%, rgba(4, 8, 16, 0.84) 100%), url("${imageSrc}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {/* O canvas do tecido é criado no efeito, quando o card chega perto da tela */}

        {/* Pontos de luz respirando sobre a fotografia (técnica de luz de MengTo/kage) */}
        {glows.map((g, idx) => (
          <i
            key={idx}
            aria-hidden="true"
            className={`kage-glow ${g.flame ? "kage-glow--flame" : ""}`}
            style={
              {
                "--gx": g.x,
                "--gy": g.y,
                "--gr": g.radius,
                "--gt": g.duration1,
                "--gt2": g.duration2,
                "--gc1": g.color1,
                "--gc2": g.color2,
              } as React.CSSProperties
            }
          />
        ))}

        {/* Etiqueta superior e seta estilo Kage */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white/85 uppercase backdrop-blur-md">
            <span className={`size-1.5 rounded-full ${active ? "bg-signal shadow-[0_0_8px_#34d399]" : "bg-brand"}`} />
            {eyebrow}
          </span>
          <span className="grid size-7 place-items-center rounded-full border border-white/20 bg-black/45 text-white/80 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100">
            <svg viewBox="0 0 14 14" fill="none" className="size-3.5">
              <path d="M3 11 11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
        </div>

        {/* Legenda inferior dentro da placa */}
        <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-10 flex items-end justify-between gap-4">
          <div className="grid gap-1">
            <h3 className="font-heading text-lg font-semibold tracking-tight text-white uppercase drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)] sm:text-xl">
              {title}
            </h3>
            <p className="max-w-[40ch] text-xs text-white/75 drop-shadow-[0_1px_12px_rgba(0,0,0,0.95)] sm:text-sm">
              {subtitle}
            </p>
          </div>
          <span className="num shrink-0 font-mono text-xs tracking-[0.24em] text-white/65 uppercase">
            {code}
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] tracking-[0.16em] text-ink-3 uppercase">
        <span>{metaLeft}</span>
        <span className="num">{metaRight}</span>
      </div>
    </article>
  );
}
