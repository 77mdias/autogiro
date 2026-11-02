import { timingSafeEqual } from "node:crypto";

// Sem imports com alias: este arquivo roda direto no `node --test`.

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Compara um token recebido em header (ex.: `asaas-access-token`) em tempo constante. */
export function verifyToken(token: string | null, secret: string | undefined): boolean {
  return !!token && !!secret && safeEqual(token, secret);
}

/** Valida "Authorization: Bearer <token>" em tempo constante. */
export function verifyBearer(header: string | null, secret: string | undefined): boolean {
  if (!header) return false;
  const token = header.replace(/^Bearer\s+/i, "");
  return token !== header && verifyToken(token, secret);
}
