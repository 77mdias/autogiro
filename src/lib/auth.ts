import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { and, eq, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { logins, lojas, membros, sessoes, usuarios, verificacoes } from "@/lib/db/schema";
import { conferirSenha, hashSenha } from "@/lib/senha";

/**
 * Login por Google ou e-mail e senha, com sessão no banco (tabela sessoes). Quem lê a sessão é lib/session.ts.
 * Cadastro, confirmação e troca de senha por e-mail são nossos (login/actions.ts e lib/conta.ts); o Better Auth
 * só confere a senha e abre a sessão.
 */
export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: usuarios, account: logins, session: sessoes, verification: verificacoes },
  }),
  advanced: {
    database: { generateId: "uuid" },
    // Sem o IP real, o limite de tentativas vira um balde só para todo mundo atrás da Cloudflare.
    ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 200,
    // Mesmo formato do Auth.js (scrypt:<salt>:<hash>): as senhas antigas continuam valendo.
    password: { hash: hashSenha, verify: ({ hash, password }) => conferirSenha(password, hash) },
  },
  socialProviders: {
    google: { clientId: process.env.AUTH_GOOGLE_ID!, clientSecret: process.env.AUTH_GOOGLE_SECRET! },
  },
  // Sessão conferida no banco no máximo a cada 5 min; o vínculo com a loja (membros) é lido a cada request.
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  databaseHooks: {
    account: {
      create: {
        after: async (login) => {
          if (login.providerId === "google") await adotarContaGoogle(login.accountId, login.userId);
        },
      },
    },
  },
  plugins: [nextCookies()], // por último: grava os cookies de sessão nas server actions
});

const outro = alias(membros, "outro");
const outra = alias(lojas, "outra");

/**
 * Antes do Better Auth, quem entrava pelo Google ficava em membros e lojas pelo `sub` do Google. No primeiro login
 * depois da troca, esse vínculo passa para o id novo. Se o usuário já tiver loja pelo id (e-mail com senha
 * de mesmo endereço), o vínculo antigo fica como está: uma conta pertence a uma loja só.
 */
async function adotarContaGoogle(sub: string, userId: string) {
  await db
    .update(membros)
    .set({ authUserId: userId })
    .where(and(eq(membros.authUserId, sub), notExists(db.select().from(outro).where(eq(outro.authUserId, userId)))));
  await db
    .update(lojas)
    .set({ authUserId: userId })
    .where(and(eq(lojas.authUserId, sub), notExists(db.select().from(outra).where(eq(outra.authUserId, userId)))));
}
