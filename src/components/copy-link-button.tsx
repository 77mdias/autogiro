"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ path, className }: { path: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
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
