"use client";

import { useState } from "react";
import { CheckCircle2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/field";
import { MaskedInput } from "@/components/masked-input";
import { PillGroup } from "@/components/pill-group";
import { formatMilhar, onlyDigits } from "@/lib/masks";
import { resizeImage } from "@/lib/resize-image";

export function SimulacaoForm({ carroId, precoReais, lojaNome }: { carroId: string; precoReais: number; lojaNome: string }) {
  const [entrada, setEntrada] = useState("");
  const [financiar, setFinanciar] = useState(formatMilhar(String(precoReais)));
  const [financiarEditado, setFinanciarEditado] = useState(false);
  const [cnhNome, setCnhNome] = useState<string>();
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(undefined);
    setEnviando(true);
    try {
      const fd = new FormData(e.currentTarget);
      const cnh = fd.get("cnh");
      if (cnh instanceof File && cnh.size > 0) fd.set("cnh", await resizeImage(cnh, 2000, 0.85));
      const res = await fetch("/api/simulacoes", { method: "POST", body: fd });
      if (!res.ok) {
        setErro((await res.json().catch(() => null))?.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      setEnviado(true);
      window.scrollTo({ top: 0 });
    } catch {
      setErro("Sem conexão. Verifique a internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div role="status" className="grid grid-cols-1 justify-items-center gap-3 py-10 text-center">
        <CheckCircle2 className="size-12" aria-hidden />
        <h2 className="text-sub-lg">Simulação enviada!</h2>
        <p className="text-muted-foreground">{lojaNome} vai falar com você pelo WhatsApp em breve.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5">
      <input type="hidden" name="carroId" value={carroId} />

      <Field label="Nome completo" htmlFor="nome">
        <Input id="nome" name="nome" required autoComplete="name" />
      </Field>
      <Field label="WhatsApp" htmlFor="telefone">
        <MaskedInput id="telefone" name="telefone" mask="phone" type="tel" required autoComplete="tel-national" placeholder="(11) 98765-4321" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor de entrada" htmlFor="valorEntrada">
          <MaskedInput
            id="valorEntrada"
            name="valorEntrada"
            mask="milhar"
            prefix="R$"
            placeholder="0"
            value={entrada}
            onValueChange={(v) => {
              setEntrada(v);
              if (!financiarEditado) setFinanciar(formatMilhar(String(Math.max(0, precoReais - Number(onlyDigits(v) || 0)))));
            }}
          />
        </Field>
        <Field label="Valor a financiar" htmlFor="valorFinanciar">
          <MaskedInput
            id="valorFinanciar"
            name="valorFinanciar"
            mask="milhar"
            prefix="R$"
            required
            value={financiar}
            onValueChange={(v) => {
              setFinanciar(v);
              setFinanciarEditado(true);
            }}
          />
        </Field>
      </div>

      <PillGroup name="parcelas" legend="Parcelas" options={["24", "36", "48", "60"].map((p) => ({ value: p, label: `${p}x` }))} defaultValue="48" required />

      <div className="grid grid-cols-1 gap-2">
        <span className="text-body-md font-medium">CNH (foto ou PDF)</span>
        <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-sm border border-dashed border-input bg-popover px-4 py-3 focus-within:ring-3 focus-within:ring-ring/50">
          <FileUp className="size-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-body-md">{cnhNome ?? "Toque para anexar sua CNH"}</span>
          <input
            type="file"
            name="cnh"
            accept="image/jpeg,image/png,application/pdf,image/*"
            className="sr-only"
            onChange={(e) => setCnhNome(e.target.files?.[0]?.name)}
          />
        </label>
        <p className="text-caption text-muted-foreground">Usada só para a análise de crédito e apagada automaticamente após o prazo legal.</p>
      </div>

      <label className="flex items-start gap-3 rounded-sm bg-card p-4 text-body-md">
        <input type="checkbox" name="lgpd" required className="mt-0.5 size-5 shrink-0 accent-primary" />
        <span>
          Autorizo {lojaNome} a usar meus dados pessoais e a imagem da minha CNH exclusivamente para análise de financiamento, conforme a LGPD.
        </span>
      </label>

      <FormError message={erro} />
      <Button type="submit" size="lg" disabled={enviando} className="w-full">
        {enviando ? "Enviando…" : "Enviar simulação"}
      </Button>
    </form>
  );
}
