import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/field";

export const metadata: Metadata = { title: "Entrar" };

// Só caminhos internos; evita open redirect via ?callbackUrl=
const destino = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/painel");

async function entrar(fd: FormData) {
  "use server";
  await signIn("google", { redirectTo: destino(fd.get("callbackUrl")) });
}

async function Login({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { callbackUrl, error } = await searchParams;
  if (await getSession()) redirect(destino(callbackUrl));
  return (
    <form action={entrar} className="grid grid-cols-1 gap-3">
      <input type="hidden" name="callbackUrl" value={destino(callbackUrl)} />
      {error && <FormError message="Não foi possível entrar. Tente novamente." />}
      <Button type="submit" size="lg">Entrar com Google</Button>
    </form>
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
      <Link href="/" aria-label="AutoGiro, página inicial" className="self-start rounded-card">
        <Wordmark />
      </Link>
      <div className="grid grid-cols-1 gap-2">
        <h1 className="font-display text-3xl font-light">Entrar no painel</h1>
        <p className="text-ink-2">Use sua conta Google para cuidar do estoque e dos interessados da sua loja.</p>
      </div>
      <Suspense>
        <Login searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
