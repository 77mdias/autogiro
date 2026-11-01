import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackHeader({ href, title }: { href: string; title: string }) {
  return (
    <header className="mb-6 flex items-center gap-3 lg:mb-10">
      <Link
        href={href}
        aria-label="Voltar"
        className="-ml-1 grid size-11 shrink-0 place-items-center rounded-full bg-paper-2 transition-colors duration-(--dur-micro) hover:bg-paper-3 motion-reduce:transition-none"
      >
        <ArrowLeft className="size-5" aria-hidden />
      </Link>
      <h1 className="min-w-0 font-display text-2xl font-light lg:text-3xl">{title}</h1>
    </header>
  );
}
