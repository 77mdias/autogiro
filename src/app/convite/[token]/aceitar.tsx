"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/field";
import { aceitarConvite } from "@/app/painel/actions";

export function AceitarConvite({ token, loja }: { token: string; loja: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string>();
  return (
    <div className="grid gap-3">
      <Button
        size="lg"
        disabled={pending}
        className="w-full sm:w-auto sm:justify-self-start"
        onClick={() => startTransition(async () => setErro((await aceitarConvite(token))?.error))}
      >
        {pending ? "Entrando…" : `Entrar na equipe da ${loja}`}
      </Button>
      <FormError message={erro} />
    </div>
  );
}
