import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { tokensEmail } from "@/lib/db/schema";
import { emailConfirmacao, emailRedefinicao } from "@/lib/email";
import { hashToken, novoToken } from "@/lib/senha";

const PRAZO = { confirmar: 24 * 60 * 60_000, redefinir: 60 * 60_000 };
// Um e-mail por minuto por conta e tipo: segura reenvios em sequência (não é rate limit por IP).
const INTERVALO_REENVIO = 60_000;

export async function mandarToken(usuarioId: string, para: string, tipo: "confirmar" | "redefinir") {
  const [recente] = await db
    .select({ id: tokensEmail.id })
    .from(tokensEmail)
    .where(and(eq(tokensEmail.usuarioId, usuarioId), eq(tokensEmail.tipo, tipo), gt(tokensEmail.createdAt, new Date(Date.now() - INTERVALO_REENVIO))))
    .limit(1);
  if (recente) return;
  const { token, tokenHash } = novoToken();
  // Um link vivo por vez: o novo invalida os anteriores do mesmo tipo.
  await db.delete(tokensEmail).where(and(eq(tokensEmail.usuarioId, usuarioId), eq(tokensEmail.tipo, tipo)));
  await db.insert(tokensEmail).values({ usuarioId, tipo, tokenHash, expiraEm: new Date(Date.now() + PRAZO[tipo]) });
  await (tipo === "confirmar" ? emailConfirmacao(para, token) : emailRedefinicao(para, token));
}

/** Consome o token (uso único) e devolve o usuário, ou null se inválido ou vencido. */
export async function usarToken(token: string, tipo: "confirmar" | "redefinir") {
  const [t] = await db
    .delete(tokensEmail)
    .where(and(eq(tokensEmail.tokenHash, hashToken(token)), eq(tokensEmail.tipo, tipo), gt(tokensEmail.expiraEm, new Date())))
    .returning({ usuarioId: tokensEmail.usuarioId });
  return t?.usuarioId ?? null;
}
