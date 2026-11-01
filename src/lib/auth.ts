import "server-only";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lojas } from "@/lib/db/schema";

declare module "next-auth" {
  interface Session {
    user: { loja_id: string | null } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // A fonte da verdade é lojas.auth_user_id = sub (id do Google). Enquanto o usuário
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
