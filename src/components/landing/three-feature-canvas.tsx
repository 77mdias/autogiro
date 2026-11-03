"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type FeatureSceneKind = "vitrine" | "cofre" | "radar";

type SceneProps = {
  kind: FeatureSceneKind;
  hovered: boolean;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
};

type Edge = [number, number];

// Constrói vértices e arestas de uma caixa 3D usando THREE.Vector3
function makeBox(w: number, h: number, d: number, yOffset = 0): { verts: THREE.Vector3[]; edges: Edge[] } {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const verts = [
    new THREE.Vector3(-hw, -hh + yOffset, -hd),
    new THREE.Vector3(hw, -hh + yOffset, -hd),
    new THREE.Vector3(hw, hh + yOffset, -hd),
    new THREE.Vector3(-hw, hh + yOffset, -hd),
    new THREE.Vector3(-hw, -hh + yOffset, hd),
    new THREE.Vector3(hw, -hh + yOffset, hd),
    new THREE.Vector3(hw, hh + yOffset, hd),
    new THREE.Vector3(-hw, hh + yOffset, hd),
  ];
  const edges: Edge[] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  return { verts, edges };
}

// Constrói um octaedro 3D usando THREE.Vector3
function makeOctahedron(r: number): { verts: THREE.Vector3[]; edges: Edge[] } {
  const verts = [
    new THREE.Vector3(0, r, 0),
    new THREE.Vector3(0, -r, 0),
    new THREE.Vector3(r, 0, 0),
    new THREE.Vector3(-r, 0, 0),
    new THREE.Vector3(0, 0, r),
    new THREE.Vector3(0, 0, -r),
  ];
  const edges: Edge[] = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [4, 3], [3, 5], [5, 2],
  ];
  return { verts, edges };
}

// Constrói um anel 3D no plano XZ ou XY usando THREE.Vector3
function makeRing(r: number, segments: number, plane: "xz" | "xy" | "yz" = "xz", yOffset = 0): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a) * r;
    const s = Math.sin(a) * r;
    if (plane === "xz") pts.push(new THREE.Vector3(c, yOffset, s));
    else if (plane === "xy") pts.push(new THREE.Vector3(c, s + yOffset, 0));
    else pts.push(new THREE.Vector3(0, c + yOffset, s));
  }
  return pts;
}

export function ThreeFeatureCanvas({ kind, hovered, pointerRef }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredRef = useRef(hovered);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 25);
    camera.position.set(0, 0.45, 3.6);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const euler = new THREE.Euler(0.28, -0.4, 0, "XYZ");
    const mat4 = new THREE.Matrix4();
    const tmp = new THREE.Vector3();

    // Geometrias pré-alocadas em Three.js
    const lowerCar = makeBox(1.42, 0.3, 0.72, -0.08);
    const upperCabin = makeBox(0.82, 0.24, 0.58, 0.18);
    const platformRing = makeRing(1.38, 48, "xz", -0.28);
    const innerRing = makeRing(0.96, 36, "xz", 0.02);

    const coreOcta = makeOctahedron(0.66);
    const outerOcta = makeOctahedron(0.95);
    const gyroRingA = makeRing(1.18, 48, "xy", 0);
    const gyroRingB = makeRing(1.34, 48, "xz", 0);
    const gyroRingC = makeRing(1.02, 40, "yz", 0);

    const radarRing1 = makeRing(0.75, 40, "xz", -0.32);
    const radarRing2 = makeRing(1.22, 48, "xz", -0.32);
    const radarRing3 = makeRing(1.62, 56, "xz", -0.32);
    const barDefs = [
      { x: -0.95, z: 0.25, h: 0.38, signal: false },
      { x: -0.48, z: -0.2, h: 0.56, signal: false },
      { x: 0.0, z: 0.18, h: 0.72, signal: false },
      { x: 0.48, z: -0.12, h: 0.94, signal: true },
      { x: 0.95, z: 0.08, h: 1.18, signal: true },
    ];

    let W = 0;
    let H = 0;
    let dpr = 1;
    let inView = true;
    let raf = 0;
    let t = 0;
    let rotY = -0.42;
    let rotX = 0.26;

    const project = (v: THREE.Vector3, matrix: THREE.Matrix4) => {
      tmp.copy(v).applyMatrix4(matrix).project(camera);
      return {
        x: (tmp.x * 0.5 + 0.5) * W,
        y: (-(tmp.y * 0.5) + 0.5) * H,
        z: tmp.z,
      };
    };

    const drawPolygonRing = (pts: THREE.Vector3[], matrix: THREE.Matrix4, stroke: string, width = 1.2, dashed = false) => {
      if (pts.length === 0) return;
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      if (dashed) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const p = project(pts[i], matrix);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };

    const drawWireMesh = (
      mesh: { verts: THREE.Vector3[]; edges: Edge[] },
      matrix: THREE.Matrix4,
      stroke: string,
      width = 1.4,
      nodeColor?: string,
    ) => {
      const projected = mesh.verts.map((v) => project(v, matrix));
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (const [a, b] of mesh.edges) {
        ctx.moveTo(projected[a].x, projected[a].y);
        ctx.lineTo(projected[b].x, projected[b].y);
      }
      ctx.stroke();
      if (nodeColor) {
        ctx.fillStyle = nodeColor;
        for (const p of projected) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    const measure = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      if (W === 0 || H === 0) return;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };

    const renderFrame = (dt: number) => {
      if (W === 0 || H === 0) measure();
      if (W === 0 || H === 0) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isHov = hoveredRef.current;
      const speed = reduced ? 0 : isHov ? 1.85 : 0.65;
      t += dt * speed;
      rotY += dt * 0.55 * speed;

      const targetYaw = rotY + pointerRef.current.x * 0.45;
      const targetPitch = (kind === "radar" ? 0.38 : 0.26) + pointerRef.current.y * 0.25;
      rotX += (targetPitch - rotX) * 0.1;

      euler.set(rotX, targetYaw, 0, "XYZ");
      mat4.makeRotationFromEuler(euler);

      if (kind === "vitrine") {
        drawPolygonRing(platformRing, mat4, "rgba(59, 130, 246, 0.55)", 1.5);
        drawPolygonRing(innerRing, mat4, "rgba(147, 197, 253, 0.35)", 1, true);
        drawWireMesh(lowerCar, mat4, "rgba(96, 165, 250, 0.9)", 1.5);
        drawWireMesh(upperCabin, mat4, "rgba(191, 219, 254, 0.85)", 1.3, "#60a5fa");

        // 15 nós orbitais representando as 15 fotos do veículo
        for (let i = 0; i < 15; i++) {
          const a = (i / 15) * Math.PI * 2 + t * 0.4;
          const waveY = -0.12 + Math.sin(t * 2 + i * 0.6) * 0.08;
          const pt = project(new THREE.Vector3(Math.cos(a) * 1.28, waveY, Math.sin(a) * 1.28), mat4);
          const isCapa = i === 0 || i === 5 || i === 10;
          ctx.fillStyle = isCapa ? "#34d399" : "#60a5fa";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isCapa ? 3.8 : 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (kind === "cofre") {
        const gEulerA = new THREE.Euler(rotX + t * 0.7, targetYaw, t * 0.4, "XYZ");
        const gMatA = new THREE.Matrix4().makeRotationFromEuler(gEulerA);
        const gEulerB = new THREE.Euler(rotX - t * 0.4, targetYaw + t * 0.8, 0, "XYZ");
        const gMatB = new THREE.Matrix4().makeRotationFromEuler(gEulerB);

        drawPolygonRing(gyroRingB, gMatB, "rgba(59, 130, 246, 0.45)", 1.3);
        drawPolygonRing(gyroRingC, gMatA, "rgba(147, 197, 253, 0.3)", 1, true);
        drawPolygonRing(gyroRingA, gMatA, "rgba(52, 211, 153, 0.85)", 1.8);
        drawWireMesh(outerOcta, gMatB, "rgba(96, 165, 250, 0.35)", 1);
        drawWireMesh(coreOcta, mat4, "rgba(96, 165, 250, 0.95)", 1.7, "#34d399");
      } else {
        drawPolygonRing(radarRing1, mat4, "rgba(59, 130, 246, 0.3)", 1, true);
        drawPolygonRing(radarRing2, mat4, "rgba(59, 130, 246, 0.5)", 1.2);
        drawPolygonRing(radarRing3, mat4, "rgba(52, 211, 153, 0.65)", 1.5);

        // Feixe de varredura do radar
        const sweepAngle = -t * 1.4;
        const centerPt = project(new THREE.Vector3(0, -0.32, 0), mat4);
        const edgePt = project(
          new THREE.Vector3(Math.cos(sweepAngle) * 1.62, -0.32, Math.sin(sweepAngle) * 1.62),
          mat4,
        );
        ctx.save();
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(centerPt.x, centerPt.y);
        ctx.lineTo(edgePt.x, edgePt.y);
        ctx.stroke();
        ctx.restore();

        // Colunas 3D de entrada, parcelas e simulação aprovada
        barDefs.forEach((b, idx) => {
          const pulseH = b.h * (1 + Math.sin(t * 2.2 + idx * 0.7) * 0.12);
          const barBox = makeBox(0.24, pulseH, 0.24, -0.32 + pulseH / 2);
          for (const v of barBox.verts) {
            v.x += b.x;
            v.z += b.z;
          }
          drawWireMesh(
            barBox,
            mat4,
            b.signal ? "rgba(52, 211, 153, 0.92)" : "rgba(96, 165, 250, 0.75)",
            b.signal ? 1.6 : 1.2,
            b.signal ? "#34d399" : undefined,
          );
        });
      }
    };

    measure();
    renderFrame(0.016);

    // O loop só existe com o card na tela: fora dela não acorda a thread principal a cada frame
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      renderFrame(dt);
      raf = inView ? requestAnimationFrame(loop) : 0;
    };

    const isHeadless = typeof navigator !== "undefined" && navigator.webdriver;
    const animate = !isHeadless && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ro = new ResizeObserver(() => {
      measure();
      renderFrame(0);
    });
    ro.observe(cv);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      if (inView && animate && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(cv);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [kind, pointerRef]);

  return <canvas ref={canvasRef} aria-hidden="true" className=" block size-full" />;
}
