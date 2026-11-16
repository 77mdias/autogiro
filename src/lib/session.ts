import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lojas, membros } from "@/lib/db/schema";
import { planoLiberado } from "@/lib/plano";
import { ehAdmin } from "@/lib/admin";

export type Sessao = {
  user: {
    id: string;
    email: string;
    name: string;
    loja_id: string | null;
    membro_id: string | null;
    papel: "gestor" | "vendedor" | null;
  };
};

/**
 * Quem está logado e a loja dele. A fonte da verdade é membros.auth_user_id = id do usuário, lida a cada request:
 * o onboarding vale sem refazer login, e vendedor desativado ou com papel trocado muda na hora.
 * `cache`: layout e página do mesmo render consultam uma vez só.
 */
export const getSession = cache(async (): Promise<Sessao | null> => {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const [m] = await db
    .select({ id: membros.id, lojaId: membros.lojaId, papel: membros.papel })
    .from(membros)
    .where(and(eq(membros.authUserId, s.user.id), eq(membros.ativo, true)))
    .limit(1);
  return {
    user: {
      id: s.user.id,
      email: s.user.email,
      name: s.user.name,
      loja_id: m?.lojaId ?? null,
      membro_id: m?.id ?? null,
      papel: m?.papel ?? null,
    },
  };
});

/**
 * Único ponto de onde o loja_id deve vir em código autenticado.
 * Nunca aceite loja_id de query string, body ou params.
 */
export async function getLojaId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.loja_id ?? null;
}

/** Para actions só do gestor (dados da loja, assinatura, editar e excluir carro): null para os demais. */
export async function getLojaIdDoGestor(): Promise<string | null> {
  const session = await getSession();
  return session?.user.papel === "gestor" ? session.user.loja_id : null;
}

export async function lojaLiberada(lojaId: string) {
  const [loja] = await db
    .select({ planoStatus: lojas.planoStatus, trialAte: lojas.trialAte, asaasSubscriptionId: lojas.asaasSubscriptionId })
    .from(lojas)
    .where(eq(lojas.id, lojaId))
    .limit(1);
  return !!loja && planoLiberado(loja);
}

export type Membro = { lojaId: string; membroId: string; papel: "gestor" | "vendedor" };

/** Loja, membro e papel de quem está logado (para actions); null sem loja. */
export async function getMembro(): Promise<Membro | null> {
  const u = (await getSession())?.user;
  return u?.loja_id && u.membro_id && u.papel ? { lojaId: u.loja_id, membroId: u.membro_id, papel: u.papel } : null;
}

type Exige = { exigePlano?: boolean; soGestor?: boolean };

/**
 * Para páginas: sem sessão → login; logado sem loja → onboarding; plano vencido → Minha loja,
 * onde fica a assinatura (essa página passa `exigePlano: false`). `soGestor`: vendedor volta ao estoque.
 */
export async function requireMembro(returnTo = "/painel", { exigePlano = true, soGestor = false }: Exige = {}): Promise<Membro> {
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  const { loja_id: lojaId, membro_id: membroId, papel } = session.user;
  if (!lojaId || !membroId || !papel) redirect("/onboarding");
  if (soGestor && papel !== "gestor") redirect("/painel/estoque");
  if (exigePlano && !(await lojaLiberada(lojaId))) redirect("/painel/loja");
  return { lojaId, membroId, papel };
}

export async function requireLojaId(returnTo = "/painel", exige: Exige = {}): Promise<string> {
  return (await requireMembro(returnTo, exige)).lojaId;
}

/** Painel do dono do SaaS: sem sessão → login; logado sem permissão → 404, para não revelar a rota. */
export async function requireAdmin(returnTo = "/admin") {
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  if (!ehAdmin(session.user.email)) notFound();
  return session;
}
