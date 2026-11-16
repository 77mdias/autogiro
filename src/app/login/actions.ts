"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessoes, usuarios } from "@/lib/db/schema";
import { gravarSenha, mandarToken, usarToken } from "@/lib/conta";
import { emailContaExistente } from "@/lib/email";

// `email` volta no erro: o React limpa o formulário a cada envio e o campo seria perdido.
export type ContaState = { error?: string; ok?: string; email?: string } | undefined;

const email = z.email("Informe um e-mail válido").trim().toLowerCase();
const senha = z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(200, "Senha longa demais");

// Só caminhos internos; evita open redirect via ?callbackUrl=
const destino = (v: unknown) =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/painel";

const campo = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");

const usuarioPorEmail = async (para: string) =>
  (await db.select({ id: usuarios.id, emailVerified: usuarios.emailVerified }).from(usuarios).where(eq(usuarios.email, para)).limit(1))[0];

export async function cadastrar(_prev: ContaState, fd: FormData): Promise<ContaState> {
  const parsed = z
    .object({ email, senha, confirmar: z.string() })
    .refine((d) => d.senha === d.confirmar, "As senhas não são iguais")
    .safeParse({ email: campo(fd, "email"), senha: campo(fd, "senha"), confirmar: campo(fd, "confirmar") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: campo(fd, "email") };
  const { email: para, senha: s } = parsed.data;

  try {
    const existente = await usuarioPorEmail(para);
    if (existente?.emailVerified) {
      // Inclui quem já entra pelo Google: o e-mail explica como entrar (ou criar uma senha pelo "esqueci a senha").
      await emailContaExistente(para);
    } else {
      // Sem confirmação a conta não vale; quem refaz o cadastro troca a senha e recebe um link novo.
      const [u] = existente
        ? [existente]
        : await db.insert(usuarios).values({ email: para }).onConflictDoNothing().returning({ id: usuarios.id });
      if (u) {
        await gravarSenha(u.id, s);
        await mandarToken(u.id, para, "confirmar");
      }
    }
  } catch (e) {
    console.error("cadastro", e);
    return { error: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes.", email: para };
  }
  // Mesma resposta com ou sem conta: a tela não revela quem já é cliente.
  return { ok: `Enviamos um link de confirmação para ${para}. Abra o e-mail para ativar a conta.` };
}

export async function entrarComSenha(_prev: ContaState, fd: FormData): Promise<ContaState> {
  const para = campo(fd, "email").trim().toLowerCase();
  try {
    await auth.api.signInEmail({ body: { email: para, password: campo(fd, "senha") }, headers: await headers() });
  } catch (e) {
    if (!(e instanceof APIError)) throw e;
    if (e.body?.code === "EMAIL_NOT_VERIFIED") {
      const u = await usuarioPorEmail(para);
      if (u) await mandarToken(u.id, para, "confirmar").catch((err) => console.error("reenvio", err));
      return { error: "Falta confirmar o e-mail. Enviamos um link novo para a sua caixa de entrada.", email: para };
    }
    return { error: "E-mail ou senha incorretos.", email: para };
  }
  redirect(destino(fd.get("callbackUrl")));
}

export async function pedirRedefinicao(_prev: ContaState, fd: FormData): Promise<ContaState> {
  const parsed = email.safeParse(campo(fd, "email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: campo(fd, "email") };
  try {
    // Quem só entra pelo Google também pode criar uma senha por aqui: o link prova que o e-mail é dele.
    const u = await usuarioPorEmail(parsed.data);
    if (u) await mandarToken(u.id, parsed.data, "redefinir");
  } catch (e) {
    console.error("redefinicao", e);
    return { error: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes.", email: parsed.data };
  }
  return { ok: `Se ${parsed.data} tiver conta, chega um link em instantes. Confira também o spam.` };
}

export async function redefinirSenha(_prev: ContaState, fd: FormData): Promise<ContaState> {
  const parsed = z
    .object({ token: z.string().min(1), senha, confirmar: z.string() })
    .refine((d) => d.senha === d.confirmar, "As senhas não são iguais")
    .safeParse({ token: campo(fd, "token"), senha: campo(fd, "senha"), confirmar: campo(fd, "confirmar") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const usuarioId = await usarToken(parsed.data.token, "redefinir");
  if (!usuarioId) return { error: "Este link venceu ou já foi usado. Peça um novo." };
  await gravarSenha(usuarioId, parsed.data.senha);
  // Abrir o link do e-mail também prova que o e-mail é dele. Senha nova encerra as sessões abertas.
  await db.update(usuarios).set({ emailVerified: true }).where(eq(usuarios.id, usuarioId));
  await db.delete(sessoes).where(eq(sessoes.userId, usuarioId));
  redirect("/login?aviso=senha");
}
