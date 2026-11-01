"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/field";
import { MaskedInput } from "@/components/masked-input";
import type { FormState } from "@/app/painel/actions";

export function LojaForm({
  action,
  inicial,
  submitLabel,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  inicial?: { nome: string; whatsapp: string | null };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="grid grid-cols-1 gap-5">
      <Field label="Nome da loja" htmlFor="nome">
        <Input id="nome" name="nome" required maxLength={80} autoComplete="organization" defaultValue={inicial?.nome} />
      </Field>
      <Field label="WhatsApp" htmlFor="whatsapp" hint="Os clientes da vitrine falam com você por este número.">
        <MaskedInput
          id="whatsapp"
          name="whatsapp"
          mask="phone"
          type="tel"
          required
          autoComplete="tel-national"
          placeholder="(11) 98765-4321"
          defaultValue={inicial?.whatsapp ?? ""}
        />
      </Field>
      <FormError message={state?.error} />
      {state && !state.error && <p role="status" className="text-sm text-signal">Dados salvos.</p>}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
