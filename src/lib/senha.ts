import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Sem imports com alias: este arquivo roda direto no `node --test`.

const scryptAsync = promisify(scrypt) as (senha: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEYLEN = 64;

/** Formato guardado: `scrypt:<salt hex>:<hash hex>` (N=16384, r=8, p=1, padrões do Node). */
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(senha.normalize("NFKC"), salt, KEYLEN);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function conferirSenha(senha: string, guardado: string): Promise<boolean> {
  const [alg, saltHex, hashHex] = guardado.split(":");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const hash = await scryptAsync(senha.normalize("NFKC"), Buffer.from(saltHex, "hex"), esperado.length);
  return timingSafeEqual(hash, esperado);
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Token para o link do e-mail; no banco fica só o hash. */
export function novoToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}
