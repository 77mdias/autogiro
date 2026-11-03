import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { usarToken } from "@/lib/conta";

// Link do e-mail de confirmação. Leitores de e-mail podem abrir o link antes da pessoa; aí o
// token já foi usado, a conta já está confirmada e o login funciona do mesmo jeito.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const usuarioId = token ? await usarToken(token, "confirmar") : null;
  if (usuarioId) await db.update(usuarios).set({ emailConfirmadoEm: new Date() }).where(eq(usuarios.id, usuarioId));
  const base = process.env.APP_BASE_URL ?? new URL(request.url).origin;
  return Response.redirect(`${base}/login?aviso=${usuarioId ? "confirmado" : "link"}`, 303);
}
