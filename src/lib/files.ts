const MAGIC: { type: string; ext: string; bytes: (number | null)[] }[] = [
  { type: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "image/webp", ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] },
  { type: "application/pdf", ext: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

/** Detecta o tipo pelo conteúdo (não confia no Content-Type do cliente). */
export function detectFile(buf: Uint8Array, allowed: string[]) {
  return MAGIC.find((m) => allowed.includes(m.type) && m.bytes.every((b, i) => b === null || buf[i] === b)) ?? null;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
