import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-display-md tracking-tight">Garagem Link</h1>
      <p className="text-muted-foreground">
        Seu estoque em uma vitrine online e simulações de financiamento direto no celular.
      </p>
      <a href="/login" className={buttonVariants({ size: "lg" })}>
        Entrar como garagista
      </a>
    </main>
  );
}
