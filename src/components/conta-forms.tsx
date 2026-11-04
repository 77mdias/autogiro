"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/field";
import { cadastrar, entrarComSenha, pedirRedefinicao, redefinirSenha, type ContaState } from "@/app/login/actions";

const Email = ({ valor }: { valor?: string }) => (
  <Field label="E-mail" htmlFor="email">
    <Input id="email" name="email" type="email" required maxLength={200} autoComplete="email" inputMode="email" defaultValue={valor} />
  </Field>
);

function SenhaNova() {
  return (
    <>
      <Field label="Senha" htmlFor="senha" hint="Pelo menos 8 caracteres.">
        <Input id="senha" name="senha" type="password" required minLength={8} maxLength={200} autoComplete="new-password" />
      </Field>
      <Field label="Repita a senha" htmlFor="confirmar">
        <Input id="confirmar" name="confirmar" type="password" required minLength={8} maxLength={200} autoComplete="new-password" />
      </Field>
    </>
  );
}

function Resultado({ state }: { state: ContaState }) {
  return (
    <>
      <FormError message={state?.error} />
      {state?.ok && (
        <p role="status" className="rounded-card border border-rule bg-paper-2 px-4 py-3 text-sm text-ink-2">
          {state.ok}
        </p>
      )}
    </>
  );
}

export function EntrarForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(entrarComSenha, undefined);
  return (
    <form action={action} className="grid grid-cols-1 gap-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Email valor={state?.email} />
      <Field label="Senha" htmlFor="senha">
        <Input id="senha" name="senha" type="password" required maxLength={200} autoComplete="current-password" />
      </Field>
      <Resultado state={state} />
      <Button type="submit" size="lg" variant="outline" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar com e-mail"}
      </Button>
    </form>
  );
}

export function CadastroForm() {
  const [state, action, pending] = useActionState(cadastrar, undefined);
  if (state?.ok) return <Resultado state={state} />;
  return (
    <form action={action} className="grid grid-cols-1 gap-5">
      <Email valor={state?.email} />
      <SenhaNova />
      <Resultado state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  );
}

export function EsqueciForm() {
  const [state, action, pending] = useActionState(pedirRedefinicao, undefined);
  if (state?.ok) return <Resultado state={state} />;
  return (
    <form action={action} className="grid grid-cols-1 gap-5">
      <Email valor={state?.email} />
      <Resultado state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Enviar link"}
      </Button>
    </form>
  );
}

export function RedefinirForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(redefinirSenha, undefined);
  return (
    <form action={action} className="grid grid-cols-1 gap-5">
      <input type="hidden" name="token" value={token} />
      <SenhaNova />
      <Resultado state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Salvando…" : "Salvar senha nova"}
      </Button>
    </form>
  );
}
