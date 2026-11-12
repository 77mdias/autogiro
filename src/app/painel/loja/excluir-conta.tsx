"use client";

import { useActionState } from "react";
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
import { excluirConta } from "../actions";

export function ExcluirConta({ gestor, vendedores, temAssinatura }: { gestor: boolean; vendedores: number; temAssinatura: boolean }) {
  const [state, action, pending] = useActionState(excluirConta, undefined);
  const equipe = vendedores === 1 ? "o acesso do vendedor" : vendedores > 1 ? `o acesso dos ${vendedores} vendedores` : "";
  const texto = gestor
    ? `Apaga a loja, os carros e as fotos, os interessados e as CNHs, as vendas${equipe ? ` e ${equipe}` : ""}. ${
        temAssinatura ? "A assinatura no Asaas é cancelada. " : ""
      }Fica guardado só o número do WhatsApp, para registrar que o teste grátis foi usado. Não dá para desfazer.`
    : "Seus carros e clientes voltam para o gestor da loja. Não dá para desfazer.";

  return (
    <section aria-labelledby="excluir-titulo" className="grid justify-items-start gap-2 border-t border-rule pt-6 lg:col-span-2">
      <h2 id="excluir-titulo" className="sr-only">
        Excluir conta
      </h2>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="ghost" className="-ml-3 text-error" />}>
          <Trash2 aria-hidden /> Excluir minha conta
        </AlertDialogTrigger>
        <AlertDialogContent>
          <form action={action} className="grid gap-5">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
              <AlertDialogDescription>{texto}</AlertDialogDescription>
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
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
