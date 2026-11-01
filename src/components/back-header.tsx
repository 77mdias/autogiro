import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackHeader({ href, title }: { href: string; title: string }) {
  return (
    <header className="mb-6 flex items-center gap-2">
      <Link href={href} aria-label="Voltar" className="-ml-2 flex size-11 items-center justify-center rounded-md hover:bg-muted">
        <ChevronLeft className="size-6" aria-hidden />
      </Link>
      <h1 className="text-sub-lg">{title}</h1>
    </header>
  );
}
