"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { path: string; className?: string; variant?: "outline" | "secondary" | "default" | "ghost"; size?: "default" | "sm" };

export function CopyLinkButton({ path, className, variant = "outline" }: Props) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(new URL(path, location.origin).toString());
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
    >
      {copiado ? <Check aria-hidden /> : <Link2 aria-hidden />}
      <span aria-live="polite">{copiado ? "Link copiado" : "Copiar link"}</span>
    </Button>
  );
}

/** Folha de compartilhar do celular; sem ela (desktop), copia o link. */
export function ShareLinkButton({
  path,
  title,
  className,
  labelClassName,
  variant = "default",
  size,
}: Props & { title: string; labelClassName?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        const url = new URL(path, location.origin).toString();
        if (navigator.share) {
          // Cancelar a folha rejeita a promise; não é erro
          await navigator.share({ title, url }).catch(() => {});
          return;
        }
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
    >
      {copiado ? <Check aria-hidden /> : <Share2 aria-hidden />}
      <span aria-live="polite" className={labelClassName}>
        {copiado ? "Link copiado" : "Compartilhar"}
      </span>
    </Button>
  );
}
