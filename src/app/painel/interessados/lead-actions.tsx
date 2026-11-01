"use client";

import { useState, useTransition } from "react";
import { IdCard, MessageCircle, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { excluirSimulacao, marcarContato } from "../actions";

export function LeadActions({ id, nome, temCnh, whatsappHref }: { id: string; nome: string; temCnh: boolean; whatsappHref: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string>();
  const contato = () => startTransition(() => marcarContato(id));

  return (
    <div className="mt-auto grid grid-cols-1 gap-2">
      {temCnh ? (
        <a
          href={`/api/simulacoes/${id}/cnh`}
          target="_blank"
          rel="noopener"
          onClick={contato}
          className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
        >
          <IdCard aria-hidden /> Ver CNH
          <span className="ml-auto text-sm text-ink-3">link vale 5 minutos</span>
        </a>
      ) : (
        <p className="flex h-12 items-center gap-2 rounded-full border border-dashed border-rule-2 px-5 text-sm text-ink-3 pointer-fine:h-10">
          <IdCard className="size-5" aria-hidden /> CNH não enviada ou já apagada
        </p>
      )}
      <a href={whatsappHref} target="_blank" rel="noopener" onClick={contato} className={buttonVariants({ variant: "signal", className: "w-full" })}>
        <MessageCircle aria-hidden /> Chamar no WhatsApp
      </a>
      <AlertDialog>
        <AlertDialogTrigger
          render={<Button variant="ghost" size="sm" className="justify-self-end text-ink-3" aria-label={`Descartar simulação de ${nome}`} />}
        >
          <Trash2 aria-hidden /> Descartar
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar a simulação de {nome}?</AlertDialogTitle>
            <AlertDialogDescription>Os dados e a CNH são apagados de vez. Não dá para desfazer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await excluirSimulacao(id);
                  setErro(r?.error);
                })
              }
            >
              {pending ? "Apagando…" : "Descartar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {erro && (
        <p role="alert" className="text-sm text-error">
          {erro}
        </p>
      )}
    </div>
  );
}
