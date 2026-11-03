import "server-only";
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { lojas, usuarios } from "@/lib/db/schema";
import { conferirSenha } from "@/lib/senha";

declare module "next-auth" {
  interface Session {
    user: { loja_id: string | null } & DefaultSession["user"];
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
    // A fonte da verdade é lojas.auth_user_id = sub (id do Google ou de usuarios). Enquanto o usuário
    // não tem loja, consulta a cada request; assim o onboarding vale sem refazer login.
    async jwt({ token }) {
      if (!token.loja_id && token.sub) {
        const [loja] = await db
          .select({ id: lojas.id })
          .from(lojas)
          .where(eq(lojas.authUserId, token.sub))
          .limit(1);
        token.loja_id = loja?.id ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.loja_id = (token.loja_id as string | null | undefined) ?? null;
      return session;
    },
  },
});
