import "server-only";
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { membros, usuarios } from "@/lib/db/schema";
import { conferirSenha } from "@/lib/senha";

declare module "next-auth" {
  interface Session {
    user: {
      loja_id: string | null;
      membro_id: string | null;
      papel: "gestor" | "vendedor" | null;
    } & DefaultSession["user"];
  }
}

export class EmailNaoConfirmado extends CredentialsSignin {
  code = "nao_confirmado";
}

const credenciais = z.object({ email: z.email().trim().toLowerCase(), senha: z.string().min(1).max(200) });
// Confere contra um hash qualquer quando o e-mail não existe: o tempo de resposta não revela quem tem conta.
const HASH_FALSO = "scrypt:00000000000000000000000000000000:" + "0".repeat(128);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: { email: {}, senha: {} },
      async authorize(raw) {
        const parsed = credenciais.safeParse(raw);
        if (!parsed.success) return null;
        const [u] = await db.select().from(usuarios).where(eq(usuarios.email, parsed.data.email)).limit(1);
        const ok = await conferirSenha(parsed.data.senha, u?.senhaHash ?? HASH_FALSO);
        if (!u || !ok) return null;
        if (!u.emailConfirmadoEm) throw new EmailNaoConfirmado();
        // id vira token.sub; a loja liga por lojas.auth_user_id, igual ao Google
        return { id: u.id, email: u.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // A fonte da verdade é membros.auth_user_id = sub (id do Google ou de usuarios). Consulta a cada
    // request: o onboarding vale sem refazer login, e vendedor desativado ou com papel trocado muda na hora.
    async jwt({ token }) {
      if (token.sub) {
        const [m] = await db
          .select({ id: membros.id, lojaId: membros.lojaId, papel: membros.papel })
          .from(membros)
          .where(and(eq(membros.authUserId, token.sub), eq(membros.ativo, true)))
          .limit(1);
        token.loja_id = m?.lojaId ?? null;
        token.membro_id = m?.id ?? null;
        token.papel = m?.papel ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.loja_id = (token.loja_id as string | null | undefined) ?? null;
      session.user.membro_id = (token.membro_id as string | null | undefined) ?? null;
      session.user.papel = (token.papel as "gestor" | "vendedor" | null | undefined) ?? null;
      return session;
    },
  },
});
