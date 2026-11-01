import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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

/** Para páginas: sem sessão → login; logado sem loja → onboarding. */
export async function requireLojaId(returnTo = "/painel"): Promise<string> {
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  if (!session.user.loja_id) redirect("/onboarding");
  return session.user.loja_id;
}
