"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/field";
import { MaskedInput } from "@/components/masked-input";
import { resizeImage } from "@/lib/resize-image";
import type { FormState } from "@/app/painel/actions";

export function LojaForm({
  action,
  inicial,
  submitLabel,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  // logoUrl presente (mesmo null) liga o campo da logo; o onboarding não manda.
  inicial?: { nome: string; whatsapp: string | null; logoUrl?: string | null };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [logo, setLogo] = useState<{ file: File; preview: string } | null>(null);
  const [processando, setProcessando] = useState(false);
  useEffect(
    () => () => {
      if (logo) URL.revokeObjectURL(logo.preview);
    },
    [logo],
  );

  async function escolherLogo(file: File | undefined) {
    if (!file) return;
    setProcessando(true);
    const pronta = await resizeImage(file, 512, 0.9, "image/png");
    setLogo({ file: pronta, preview: URL.createObjectURL(pronta) });
    setProcessando(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("seletorLogo");
    if (logo) fd.set("logo", logo.file);
    startTransition(() => formAction(fd));
  }

  const logoAtual = logo?.preview ?? inicial?.logoUrl;
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5">
      {inicial?.logoUrl !== undefined && (
        <Field label="Logo" htmlFor="seletorLogo" hint="Aparece no topo da vitrine. JPG, PNG ou WEBP, de preferência quadrada.">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-card border border-rule bg-paper-2">
              {logoAtual ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview local/R2
                <img src={logoAtual} alt="" className="size-full object-contain" />
              ) : (
                <ImagePlus className="size-6 text-ink-3" strokeWidth={1.5} aria-hidden />
              )}
            </span>
            <label className="inline-flex h-10 cursor-pointer items-center rounded-card border border-rule-2 px-4 text-sm text-ink transition-colors duration-(--dur-micro) focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus hover:border-ink motion-reduce:transition-none">
              {processando ? "Preparando…" : logoAtual ? "Trocar logo" : "Enviar logo"}
              <input
                id="seletorLogo"
                type="file"
                name="seletorLogo"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  escolherLogo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </Field>
      )}
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
      <Button type="submit" size="lg" disabled={pending || processando} className="w-full">
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
