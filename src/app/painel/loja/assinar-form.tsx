"use client";

import { useActionState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/field";
import { assinar } from "../actions";

export function AssinarForm({ rotulo, destaque }: { rotulo: string; destaque: boolean }) {
  const [state, formAction, pending] = useActionState(assinar, undefined);
  return (
    <form action={formAction} className="grid grid-cols-1 gap-3">
      <FormError message={state?.error} />
      <Button type="submit" variant={destaque ? "default" : "outline"} disabled={pending} aria-busy={pending} className="w-full sm:w-auto sm:justify-self-start">
        <CreditCard aria-hidden /> {pending ? "Abrindo o Asaas…" : rotulo}
      </Button>
    </form>
  );
}
