"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CONFIRMACAO_EXCLUSAO } from "@/lib/exclusao";
import { excluirConta } from "@/app/painel/actions";

/** `papel` null = conta sem loja (parou no onboarding ou vendedor desativado). */
type Props = { papel: "gestor" | "vendedor" | null; vendedores?: number; temAssinatura?: boolean };

function texto({ papel, vendedores = 0, temAssinatura = false }: Props) {
  if (papel === "vendedor") return "Seus carros e clientes voltam para o gestor da loja. Não dá para desfazer.";
  if (!papel) return "Apaga sua conta do AutoGiro. Não dá para desfazer.";
  const equipe = vendedores === 1 ? "o acesso do vendedor" : vendedores > 1 ? `o acesso dos ${vendedores} vendedores` : "";
  return `Apaga a loja, os carros e as fotos, os interessados e as CNHs, as vendas${equipe ? ` e ${equipe}` : ""}. ${
    temAssinatura ? "A assinatura no Asaas é cancelada. " : ""
  }Fica guardado só o número do WhatsApp, para registrar que o teste grátis foi usado. Não dá para desfazer.`;
}

export function ExcluirConta(props: Props) {
  // Cada abertura monta o formulário de novo: o erro da tentativa anterior não fica na tela.
  const [abertura, setAbertura] = useState(0);
  return (
    <section aria-labelledby="excluir-titulo" className="grid justify-items-start gap-2 border-t border-rule pt-6 lg:col-span-2">
      <h2 id="excluir-titulo" className="sr-only">
        Excluir conta
      </h2>
      <AlertDialog onOpenChange={(aberto) => aberto && setAbertura((n) => n + 1)}>
        <AlertDialogTrigger render={<Button variant="ghost" className="-ml-3 text-error" />}>
          <Trash2 aria-hidden /> Excluir minha conta
        </AlertDialogTrigger>
        <AlertDialogContent>
          <Formulario key={abertura} descricao={texto(props)} />
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function Formulario({ descricao }: { descricao: string }) {
  const [state, action, pending] = useActionState(excluirConta, undefined);
  return (
    <form action={action} className="grid gap-5">
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
        <AlertDialogDescription>{descricao}</AlertDialogDescription>
      </AlertDialogHeader>
      <Field label={`Digite ${CONFIRMACAO_EXCLUSAO} para confirmar`} htmlFor="confirmacao">
        <Input id="confirmacao" name="confirmacao" autoComplete="off" autoCapitalize="characters" required />
      </Field>
      <FormError message={state?.error} />
      <AlertDialogFooter>
        <AlertDialogCancel>Manter conta</AlertDialogCancel>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Excluindo…" : "Excluir conta"}
        </Button>
      </AlertDialogFooter>
    </form>
  );
}
