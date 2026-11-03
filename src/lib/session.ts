import "server-only";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lojas } from "@/lib/db/schema";
import { planoLiberado } from "@/lib/plano";
import { ehAdmin } from "@/lib/admin";

// Auth.js regrava o cookie da sessão (crypto aleatório); connection() marca o render como
// dinâmico antes disso, senão o Cache Components acusa valor instável no prerender.
export async function getSession() {
  await connection();
  return auth();
}

/**
 * Único ponto de onde o loja_id deve vir em código autenticado.
 * Nunca aceite loja_id de query string, body ou params.
 */
export async function getLojaId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.loja_id ?? null;
}

export async function lojaLiberada(lojaId: string) {
  const [loja] = await db
    .select({ planoStatus: lojas.planoStatus, trialAte: lojas.trialAte, asaasSubscriptionId: lojas.asaasSubscriptionId })
    .from(lojas)
    .where(eq(lojas.id, lojaId))
    .limit(1);
  return !!loja && planoLiberado(loja);
}

/**
 * Para páginas: sem sessão → login; logado sem loja → onboarding; plano vencido → Minha loja,
 * onde fica a assinatura (essa página passa `exigePlano: false`).
 */
export async function requireLojaId(returnTo = "/painel", { exigePlano = true } = {}): Promise<string> {
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  if (!session.user.loja_id) redirect("/onboarding");
  if (exigePlano && !(await lojaLiberada(session.user.loja_id))) redirect("/painel/loja");
  return session.user.loja_id;
}

/** Painel do dono do SaaS: sem sessão → login; logado sem permissão → 404, para não revelar a rota. */
export async function requireAdmin(returnTo = "/admin") {
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  if (!ehAdmin(session.user.email)) notFound();
  return session;
}
