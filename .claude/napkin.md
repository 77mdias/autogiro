# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-11-03] Next.js 16.4.3 / React 19 / Three.js 0.187 stack**
   Do instead: Check `node_modules/next/dist/docs/` for Next.js 16 conventions and use dynamic client boundaries or `'use client'` for WebGL/Three.js canvas components.

## Shell & Command Reliability
1. **[2026-11-03] Package manager is pnpm**
   Do instead: Run `pnpm` commands (`pnpm build`, `pnpm lint`, `pnpm test`) instead of npm/yarn.

## Domain Behavior Guardrails
1. **[2026-11-03] Three.js / R3F performance on scroll landing pages**
   Do instead: Store scroll progress and frame-by-frame animation state in refs rather than React state to avoid re-renders during 60fps scroll loops.

## User Directives
1. **[2026-11-03] Reference MengTo/kage and `public/landing` assets for 3D scroll animations**
   Do instead: Study `~/Documentos/design-systems-of-web/mengto.github.io_kage` architecture, shaders, lighting, and scroll choreography and apply those techniques to AutoGiro's landing page using `public/landing` assets.
