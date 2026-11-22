"use client";

import { ErroTela } from "@/components/erro-tela";

export default function PainelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErroTela error={error} reset={reset} inicio="/painel" />;
}
