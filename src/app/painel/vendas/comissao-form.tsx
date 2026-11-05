"use client";

import { useActionState } from "react";
import { MaskedInput } from "@/components/masked-input";
import { Button } from "@/components/ui/button";
import { salvarComissao } from "../actions";

/** Comissão em reais; a % aparece ao lado depois de salvar. Vazio = ainda não definida. */
export function ComissaoForm({ id, comissaoCentavos, carro }: { id: string; comissaoCentavos: number | null; carro: string }) {
  const [state, action, pending] = useActionState(salvarComissao, undefined);
  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-2">
        <label htmlFor={`comissao-${id}`} className="sr-only">
          Comissão da venda do {carro}, em reais
        </label>
        <MaskedInput
          id={`comissao-${id}`}
          name="comissao"
          mask="milhar"
          prefix="R$"
          placeholder="Definir"
          defaultValue={comissaoCentavos == null ? "" : String(Math.round(comissaoCentavos / 100))}
          className="w-36"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
