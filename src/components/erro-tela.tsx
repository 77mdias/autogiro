"use client";

import { startTransition, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudAlert, RefreshCw, ServerCrash, WifiOff, type LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { codigoDoErro, tipoDoErro, type TipoErro } from "@/lib/erro";

const TEXTOS: Record<TipoErro, { icone: LucideIcon; titulo: string; texto: string; recarregar?: true }> = {
  offline: {
    icone: WifiOff,
    titulo: "Você está sem internet",
    texto: "Quando a conexão voltar, a tela carrega sozinha. Se preferir, tente de novo.",
  },
  atualizacao: {
    icone: RefreshCw,
    titulo: "O AutoGiro foi atualizado",
    texto: "Esta aba ainda está com a versão anterior. Recarregue a página para continuar de onde parou.",
    recarregar: true,
  },
  conexao: {
    icone: CloudAlert,
    titulo: "A conexão caiu no meio do caminho",
    texto: "A internet oscilou enquanto a tela carregava. Tente de novo.",
  },
  servidor: {
    icone: ServerCrash,
    titulo: "Algo deu errado do nosso lado",
    texto: "O erro ficou registrado. Tente de novo em alguns segundos; se continuar, fale com a AutoGiro.",
  },
};

const assinarConexao = (avisar: () => void) => {
  addEventListener("online", avisar);
  addEventListener("offline", avisar);
  return () => {
    removeEventListener("online", avisar);
    removeEventListener("offline", avisar);
  };
};

/**
 * Tela de erro com o motivo: sem internet, versão nova no ar, conexão que caiu ou falha no servidor.
 * `inicio`: para onde volta o link. `recarregarSempre`: no global-error não há layout para refazer, só recarregar.
 */
export function ErroTela({
  error,
  reset,
  inicio = "/",
  recarregarSempre = false,
}: {
  error: unknown;
  reset: () => void;
  inicio?: string;
  recarregarSempre?: boolean;
}) {
  const router = useRouter();
  const online = useSyncExternalStore(assinarConexao, () => navigator.onLine, () => true);
  const tipo = tipoDoErro(error, online);
  const { icone: Icone, titulo, texto, recarregar } = TEXTOS[tipo];
  const codigo = tipo === "servidor" ? codigoDoErro(error) : undefined;

  // Pede a tela de novo ao servidor (só o reset() redesenharia o mesmo erro).
  const tentar = () => {
    if (recarregar || recarregarSempre) return location.reload();
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  // Voltou a internet: tenta sozinho, uma vez.
  const estavaOffline = useRef(!online);
  useEffect(() => {
    if (online && estavaOffline.current) {
      estavaOffline.current = false;
      tentar();
    }
    if (!online) estavaOffline.current = true;
  });

  return (
    <section role="alert" className="ticks grid justify-items-start gap-4 px-6 py-12">
      <Icone className="size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
      <h1 className="font-display text-2xl font-light">{titulo}</h1>
      <p className="max-w-[48ch] text-ink-2">{texto}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={tentar}>
          {recarregar || recarregarSempre ? "Recarregar a página" : "Tentar de novo"}
        </Button>
        <Link href={inicio} className={buttonVariants({ variant: "outline" })}>
          Voltar ao início
        </Link>
      </div>
      {codigo && (
        <p className="text-sm text-ink-3">
          Código do erro: <span className="num">{codigo}</span>
        </p>
      )}
    </section>
  );
}
