"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { excluirCarro } from "../../actions";

export function ExcluirCarro({ id, nome }: { id: string; nome: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string>();

  return (
    <div className="grid justify-items-start gap-2 border-t border-rule pt-6">
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="ghost" className="-ml-3 text-error" />}>
          <Trash2 aria-hidden /> Excluir carro
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o {nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              O carro e as fotos saem do estoque e da vitrine de vez. As simulações recebidas continuam em Interessados.
              Se ele só foi vendido, marque como vendido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await excluirCarro(id);
                  setErro(r?.error);
                })
              }
            >
              {pending ? "Excluindo…" : "Excluir"}
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
