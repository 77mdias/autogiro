"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aprovarPedido, recusarPedido } from "../actions";

export function PedidoAcoes({ id, excluir }: { id: string; excluir: boolean }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string>();
  const decidir = (acao: typeof aprovarPedido) =>
    startTransition(async () => {
      const r = await acao(id);
      setErro(r?.error);
    });

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={() => decidir(aprovarPedido)}>
          <Check aria-hidden /> {excluir ? "Aprovar e excluir" : "Aprovar"}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => decidir(recusarPedido)} className="text-ink-3">
          <X aria-hidden /> Recusar
        </Button>
      </div>
      {erro && (
        <p role="alert" className="text-sm text-error">
          {erro}
        </p>
      )}
    </div>
  );
}
