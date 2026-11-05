import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { convites, lojas } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { hashToken } from "@/lib/senha";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { AceitarConvite } from "./aceitar";

export const metadata: Metadata = { title: "Convite para a equipe", robots: { index: false } };

async function Convite({ params }: { params: PageProps<"/convite/[token]">["params"] }) {
  const { token } = await params;
  const [session, [convite]] = await Promise.all([
    getSession(),
    // Só lê; o convite é gasto ao aceitar (aceitarConvite)
    db
      .select({ nome: convites.nome, loja: lojas.nome })
      .from(convites)
      .innerJoin(lojas, eq(lojas.id, convites.lojaId))
      .where(and(eq(convites.tokenHash, hashToken(token)), gt(convites.expiraEm, new Date())))
      .limit(1),
  ]);

  if (!convite) {
    return (
      <>
        <h1 className="font-display text-3xl font-semibold">Convite inválido</h1>
        <p className="text-ink-2">Este link já foi usado ou venceu. Peça um novo ao gestor da loja.</p>
      </>
    );
  }

  const aqui = `/convite/${token}`;
  return (
    <>
      <div className="grid gap-2 border-b border-rule pb-6">
        <h1 className="font-display text-3xl font-semibold">Entre na equipe da {convite.loja}</h1>
        <p className="text-ink-2">
          {convite.nome}, você foi convidado como vendedor. Você cadastra carros e atende os clientes dos seus carros.
        </p>
      </div>
      {!session ? (
        <div className="grid gap-3">
          <Link href={`/login?callbackUrl=${encodeURIComponent(aqui)}`} className={buttonVariants({ className: "w-full sm:w-auto" })}>
            Entrar para aceitar
          </Link>
          <p className="text-sm text-ink-3">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-ink underline underline-offset-4">
              Crie uma
            </Link>{" "}
            e, depois de confirmar o e-mail, abra este link de novo.
          </p>
        </div>
      ) : session.user.loja_id ? (
        <p role="alert" className="text-ink-2">
          Você entrou com uma conta que já faz parte de uma loja. Para aceitar, saia e entre com outra conta.
        </p>
      ) : (
        <AceitarConvite token={token} loja={convite.loja} />
      )}
    </>
  );
}

export default function ConvitePage({ params }: PageProps<"/convite/[token]">) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex h-16 w-full max-w-(--container) items-center px-4 lg:h-20 lg:px-(--gutter)">
          <Link href="/" aria-label="AutoGiro, página inicial" className="rounded-card">
            <Wordmark />
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10 lg:py-16">
        <div className="ticks grid content-start gap-6 bg-paper-2 p-6 sm:p-10">
          <Suspense fallback={<p className="text-ink-3">Carregando…</p>}>
            <Convite params={params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
