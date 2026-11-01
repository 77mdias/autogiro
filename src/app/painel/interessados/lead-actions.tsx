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
    <div className="grid grid-cols-1 gap-2">
      <div className="flex gap-2">
        {temCnh ? (
          <a href={`/api/simulacoes/${id}/cnh`} target="_blank" rel="noopener" onClick={contato} className={buttonVariants({ className: "min-w-0 flex-1 px-3" })}>
            <IdCard aria-hidden /> Ver CNH
          </a>
        ) : (
          <Button disabled className="min-w-0 flex-1 px-3">Sem CNH</Button>
        )}
        <a href={whatsappHref} target="_blank" rel="noopener" onClick={contato} className={buttonVariants({ variant: "outline", className: "min-w-0 flex-1 px-3" })}>
          <MessageCircle aria-hidden /> WhatsApp
        </a>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label={`Excluir simulação de ${nome}`} />}>
            <Trash2 className="text-muted-foreground" aria-hidden />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir simulação?</AlertDialogTitle>
              <AlertDialogDescription>
                Os dados de {nome}, incluindo a CNH, serão apagados definitivamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {erro && <p role="alert" className="text-body-md text-destructive">{erro}</p>}
    </div>
  );
}
