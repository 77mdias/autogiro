"use client";

import { useActionState, useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/field";
import { CopyLinkButton, ShareLinkButton } from "@/components/copy-link-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelarConvite, convidarVendedor, desativarVendedor, reativarVendedor } from "../actions";

export function ConviteForm({ cheia }: { cheia: boolean }) {
  const [state, action, pending] = useActionState(convidarVendedor, undefined);

  if (state?.link) {
    return (
      <div className="grid gap-3" role="status">
        <p className="text-ink-2">Link pronto. Mande para o vendedor; ele vale 7 dias e serve para uma pessoa só.</p>
        <p className="num truncate rounded-card bg-paper-2 px-4 py-3 text-ink-2">{state.link}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-flow-col sm:justify-start">
          <ShareLinkButton path={state.link} title="Convite para a equipe" />
          <CopyLinkButton path={state.link} />
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <Field label="Nome do vendedor" htmlFor="nome" hint="Aparece para você nos clientes e nas vendas dele.">
        <Input id="nome" name="nome" required minLength={2} maxLength={60} autoComplete="off" disabled={cheia} />
      </Field>
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending || cheia} className="justify-self-start">
        <UserPlus aria-hidden /> {pending ? "Gerando…" : "Gerar link de convite"}
      </Button>
    </form>
  );
}

export function VendedorAcoes({ id, nome, ativo }: { id: string; nome: string; ativo: boolean }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string>();
  const rodar = (acao: typeof desativarVendedor) =>
    startTransition(async () => {
      setErro((await acao(id))?.error);
    });

  return (
    <div className="grid justify-items-end gap-1">
      {ativo ? (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-ink-3" />}>Desativar</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar {nome}?</AlertDialogTitle>
              <AlertDialogDescription>
                Ele perde o acesso na hora. Os carros e clientes dele passam para você. Dá para reativar depois.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Manter</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={pending} onClick={() => rodar(desativarVendedor)}>
                {pending ? "Desativando…" : "Desativar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => rodar(reativarVendedor)}>
          {pending ? "Reativando…" : "Reativar"}
        </Button>
      )}
      {erro && (
        <p role="alert" className="text-sm text-error">
          {erro}
        </p>
      )}
    </div>
  );
}

export function CancelarConvite({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="ghost" size="sm" className="text-ink-3" disabled={pending} onClick={() => startTransition(() => cancelarConvite(id))}>
      {pending ? "Cancelando…" : "Cancelar"}
    </Button>
  );
}
