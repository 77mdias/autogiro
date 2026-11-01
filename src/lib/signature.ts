import { createHmac, timingSafeEqual } from "node:crypto";

// Sem imports com alias: este arquivo roda direto no `node --test`.

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** HMAC-SHA256 hex do corpo bruto; aceita assinatura com ou sem prefixo "sha256=". */
export function verifyHmacSha256(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return safeEqual(signature.trim().replace(/^sha256=/i, "").toLowerCase(), expected);
}

/** Valida "Authorization: Bearer <token>" em tempo constante. */
export function verifyBearer(header: string | null, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  const token = header.replace(/^Bearer\s+/i, "");
  return token !== header && safeEqual(token, secret);
}
