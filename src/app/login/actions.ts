"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CredentialsSignin } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { mandarToken, usarToken } from "@/lib/conta";
import { emailContaExistente } from "@/lib/email";
import { hashSenha } from "@/lib/senha";

// `email` volta no erro: o React limpa o formulário a cada envio e o campo seria perdido.
export type ContaState = { error?: string; ok?: string; email?: string } | undefined;

const email = z.email("Informe um e-mail válido").trim().toLowerCase();
const senha = z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(200, "Senha longa demais");

// Só caminhos internos; evita open redirect via ?callbackUrl=
const destino = (v: unknown) =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/painel";

const campo = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");

export async function cadastrar(_prev: ContaState, fd: FormData): Promise<ContaState> {
  const parsed = z
    .object({ email, senha, confirmar: z.string() })
    .refine((d) => d.senha === d.confirmar, "As senhas não são iguais")
    .safeParse({ email: campo(fd, "email"), senha: campo(fd, "senha"), confirmar: campo(fd, "confirmar") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: campo(fd, "email") };
  const { email: para, senha: s } = parsed.data;

  try {
    const [existente] = await db.select().from(usuarios).where(eq(usuarios.email, para)).limit(1);
    if (existente?.emailConfirmadoEm) {
      await emailContaExistente(para);
    } else {
      // Sem confirmação a conta não vale; quem refaz o cadastro troca a senha e recebe um link novo.
      const senhaHash = await hashSenha(s);
      const [u] = existente
        ? await db.update(usuarios).set({ senhaHash }).where(eq(usuarios.id, existente.id)).returning({ id: usuarios.id })
        : await db.insert(usuarios).values({ email: para, senhaHash }).onConflictDoNothing().returning({ id: usuarios.id });
      if (u) await mandarToken(u.id, para, "confirmar");
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
    await signIn("credentials", { email: para, senha: campo(fd, "senha"), redirectTo: destino(fd.get("callbackUrl")) });
  } catch (e) {
    if (!(e instanceof CredentialsSignin)) throw e; // inclui o redirect de sucesso
    if (e.code === "nao_confirmado") {
      const [u] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, para)).limit(1);
      if (u) await mandarToken(u.id, para, "confirmar").catch((err) => console.error("reenvio", err));
      return { error: "Falta confirmar o e-mail. Enviamos um link novo para a sua caixa de entrada.", email: para };
    }
    return { error: "E-mail ou senha incorretos.", email: para };
  }
}

export async function pedirRedefinicao(_prev: ContaState, fd: FormData): Promise<ContaState> {
  const parsed = email.safeParse(campo(fd, "email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: campo(fd, "email") };
  try {
    const [u] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, parsed.data)).limit(1);
    if (u) await mandarToken(u.id, parsed.data, "redefinir");
  } catch (e) {
    console.error("redefinicao", e);
    return { error: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes.", email: parsed.data };
  }
  return { ok: `Se ${parsed.data} tiver conta com senha, chega um link em instantes. Confira também o spam.` };
}

export async function redefinirSenha(_prev: ContaState, fd: FormData): Promise<ContaState> {
  const parsed = z
    .object({ token: z.string().min(1), senha, confirmar: z.string() })
    .refine((d) => d.senha === d.confirmar, "As senhas não são iguais")
    .safeParse({ token: campo(fd, "token"), senha: campo(fd, "senha"), confirmar: campo(fd, "confirmar") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const usuarioId = await usarToken(parsed.data.token, "redefinir");
  if (!usuarioId) return { error: "Este link venceu ou já foi usado. Peça um novo." };
  // Abrir o link do e-mail também prova que o e-mail é dele.
  await db
    .update(usuarios)
    .set({ senhaHash: await hashSenha(parsed.data.senha), emailConfirmadoEm: new Date() })
    .where(eq(usuarios.id, usuarioId));
  redirect("/login?aviso=senha");
}
