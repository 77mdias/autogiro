"use client";

import { Button } from "@/components/ui/button";

export default function PainelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section role="alert" className="ticks grid justify-items-start gap-4 px-6 py-12">
      <h1 className="font-display text-2xl font-light">Não deu para carregar esta tela</h1>
      <p className="max-w-[48ch] text-ink-2">
        A conexão com o servidor falhou. Seus dados estão salvos; tente de novo em alguns segundos.
      </p>
      <Button type="button" onClick={reset}>
        Tentar de novo
      </Button>
    </section>
  );
}
