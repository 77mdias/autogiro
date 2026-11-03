import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/field";
import { ContaShell } from "@/components/conta-shell";
import { EntrarForm } from "@/components/conta-forms";

export const metadata: Metadata = { title: "Entrar" };

// Só caminhos internos; evita open redirect via ?callbackUrl=
const destino = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/painel");

const AVISOS: Record<string, string> = {
  confirmado: "E-mail confirmado. Agora é só entrar.",
  senha: "Senha nova salva. Entre com ela.",
  link: "Este link venceu ou já foi usado. Se o e-mail ainda não estiver confirmado, tente entrar: mandamos um link novo.",
};

async function entrarGoogle(fd: FormData) {
  "use server";
  await signIn("google", { redirectTo: destino(fd.get("callbackUrl")) });
}

async function Login({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { callbackUrl, error, aviso } = await searchParams;
  if (await getSession()) redirect(destino(callbackUrl));
  const msg = typeof aviso === "string" ? AVISOS[aviso] : undefined;
  return (
    <div className="grid grid-cols-1 gap-6">
      {msg && (
        <p role="status" className="rounded-card border border-rule bg-paper-2 px-4 py-3 text-sm text-ink-2">
          {msg}
        </p>
      )}
      <form action={entrarGoogle} className="grid grid-cols-1 gap-3">
        <input type="hidden" name="callbackUrl" value={destino(callbackUrl)} />
        {error && <FormError message="Não foi possível entrar. Tente novamente." />}
        <Button type="submit" size="lg">Entrar com Google</Button>
      </form>
      <p className="flex items-center gap-3 text-sm text-ink-3 before:h-px before:flex-1 before:bg-rule after:h-px after:flex-1 after:bg-rule">ou com e-mail</p>
      <EntrarForm callbackUrl={destino(callbackUrl)} />
      <div className="grid grid-cols-1 gap-2 text-sm text-ink-2">
        <Link href="/esqueci-senha" className="justify-self-start rounded-card underline underline-offset-4 hover:text-ink">
          Esqueci a senha
        </Link>
        <p>
          Não tem conta?{" "}
          <Link href="/cadastro" className="rounded-card text-brand underline underline-offset-4">
            Criar conta com e-mail
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <ContaShell titulo="Entrar no painel" texto="Use sua conta Google ou seu e-mail para cuidar do estoque e dos interessados da sua loja.">
      <Suspense>
        <Login searchParams={props.searchParams} />
      </Suspense>
    </ContaShell>
  );
}
