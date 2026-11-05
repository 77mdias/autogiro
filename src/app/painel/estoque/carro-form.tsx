"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/field";
import { MaskedInput } from "@/components/masked-input";
import { PillGroup } from "@/components/pill-group";
import { resizeImage } from "@/lib/resize-image";
import { salvarCarro } from "../actions";

export type CarroInicial = {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  km: number;
  precoCentavos: number;
  cambio: string | null;
  combustivel: string | null;
  cor: string | null;
  descricao: string | null;
  status: "disponivel" | "vendido";
  fotos: { key: string; url: string }[];
};

const MARCAS = ["Chevrolet", "Fiat", "Volkswagen", "Toyota", "Hyundai", "Honda", "Renault", "Jeep", "Ford", "Nissan", "Peugeot", "Citroën", "BYD", "Mitsubishi", "Kia"];
const CORES = ["Branco", "Preto", "Prata", "Cinza", "Vermelho", "Azul", "Marrom", "Bege", "Verde"];

/** `paraAprovacao`: vendedor editando; o envio vira pedido para o gestor. */
export function CarroForm({ carro, paraAprovacao = false }: { carro?: CarroInicial; paraAprovacao?: boolean }) {
  const [state, formAction, pending] = useActionState(salvarCarro, undefined);
  const [novas, setNovas] = useState<{ file: File; preview: string }[]>([]);
  const [removidas, setRemovidas] = useState<Set<string>>(new Set());
  const [processando, setProcessando] = useState(false);

  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach((p) => URL.revokeObjectURL(p)), []);

  async function adicionarFotos(files: FileList | null) {
    if (!files?.length) return;
    setProcessando(true);
    const prontas = await Promise.all([...files].map((f) => resizeImage(f)));
    const itens = prontas.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    previews.current.push(...itens.map((i) => i.preview));
    setNovas((atual) => [...atual, ...itens]);
    setProcessando(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("seletorFotos");
    novas.forEach((n) => fd.append("fotos", n.file));
    removidas.forEach((k) => fd.append("removerFotos", k));
    startTransition(() => formAction(fd));
  }

  const existentes = carro?.fotos.filter((f) => !removidas.has(f.key)) ?? [];
  const totalFotos = existentes.length + novas.length;

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      {carro && <input type="hidden" name="id" value={carro.id} />}

      <section aria-labelledby="fotos-titulo" className="grid min-w-0 grid-cols-1 content-start gap-3 lg:sticky lg:top-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="fotos-titulo" className="font-display text-xl font-semibold">
            Fotos
          </h2>
          <p className="num text-sm text-ink-3">{totalFotos} de 15</p>
        </div>
        <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-2 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          <li className="shrink-0">
            <label className="flex aspect-[5/4] w-36 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-rule-2 bg-paper text-sm text-ink-2 transition-colors duration-(--dur-micro) focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus hover:border-ink motion-reduce:transition-none lg:w-full">
              <Camera className="size-6" strokeWidth={1.5} aria-hidden />
              {processando ? "Preparando…" : "Adicionar fotos"}
              <input
                type="file"
                name="seletorFotos"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  adicionarFotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </li>
          {existentes.map((f, i) => (
            <Thumb key={f.key} src={f.url} capa={i === 0} onRemove={() => setRemovidas((s) => new Set(s).add(f.key))} />
          ))}
          {novas.map((n, i) => (
            <Thumb
              key={n.preview}
              src={n.preview}
              capa={existentes.length === 0 && i === 0}
              onRemove={() => setNovas((a) => a.filter((_, j) => j !== i))}
            />
          ))}
        </ul>
        <p className="text-sm text-ink-3">A primeira foto é a capa na vitrine. Fotos na horizontal, com luz do dia, mostram melhor o carro.</p>
      </section>

      <div className="grid min-w-0 grid-cols-1 content-start gap-8">
        <fieldset className="min-w-0">
          <legend className="mb-5 font-display text-xl font-semibold">Identificação e preço</legend>
          <div className="grid grid-cols-1 gap-5">
          <Field label="Marca" htmlFor="marca">
            <Input id="marca" name="marca" list="marcas" required autoComplete="off" defaultValue={carro?.marca} />
            <datalist id="marcas">{MARCAS.map((m) => <option key={m} value={m} />)}</datalist>
          </Field>

          <Field label="Modelo e versão" htmlFor="modelo">
            <Input id="modelo" name="modelo" required placeholder="Ex.: Onix LT 1.0 Turbo" defaultValue={carro?.modelo} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ano" htmlFor="ano">
              <Input id="ano" name="ano" inputMode="numeric" pattern="\d{4}" maxLength={4} required placeholder="2022" defaultValue={carro?.ano} />
            </Field>
            <Field label="Quilometragem" htmlFor="km">
              <MaskedInput id="km" name="km" mask="milhar" suffix="km" required placeholder="45.000" defaultValue={carro ? String(carro.km) : ""} />
            </Field>
          </div>

          <Field label="Preço de venda" htmlFor="preco">
            <MaskedInput
              id="preco"
              name="preco"
              mask="milhar"
              prefix="R$"
              required
              placeholder="65.900"
              className="num h-14 font-display text-2xl pointer-fine:h-14"
              defaultValue={carro ? String(Math.round(carro.precoCentavos / 100)) : ""}
            />
          </Field>
          </div>
        </fieldset>

        <fieldset className="min-w-0 border-t border-rule pt-8">
          <legend className="float-left mb-5 w-full font-display text-xl font-semibold">Especificações de um toque</legend>
          <div className="clear-both grid grid-cols-1 gap-5">
          <PillGroup name="cambio" legend="Câmbio" options={["Manual", "Automático"]} defaultValue={carro?.cambio} />
          <PillGroup
            name="combustivel"
            legend="Combustível"
            options={["Flex", "Gasolina", "Etanol", "Diesel", "Elétrico", "Híbrido"]}
            defaultValue={carro?.combustivel ?? "Flex"}
          />
          <Field label="Cor" htmlFor="cor">
            <Input id="cor" name="cor" list="cores" autoComplete="off" defaultValue={carro?.cor ?? ""} />
            <datalist id="cores">{CORES.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Observações" htmlFor="descricao" hint="Aparece na página do carro, abaixo das especificações.">
            <Textarea id="descricao" name="descricao" rows={3} placeholder="Único dono, revisões em dia…" defaultValue={carro?.descricao ?? ""} />
          </Field>
          {carro && (
            <PillGroup
              name="status"
              legend="Situação"
              options={[{ value: "disponivel", label: "Disponível" }, { value: "vendido", label: "Vendido" }]}
              defaultValue={carro.status}
            />
          )}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-3 border-t border-rule pt-6">
          <FormError message={state?.error} />
          <Button type="submit" size="lg" disabled={pending || processando} aria-busy={pending || undefined} className="w-full sm:w-auto sm:justify-self-start">
            {pending ? "Salvando…" : paraAprovacao ? "Enviar para o gestor aprovar" : carro ? "Salvar alterações" : "Cadastrar carro"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Thumb({ src, capa, onRemove }: { src: string; capa: boolean; onRemove: () => void }) {
  return (
    <li className="relative aspect-[5/4] w-36 shrink-0 lg:w-full">
      {/* eslint-disable-next-line @next/next/no-img-element -- preview local/R2 */}
      <img src={src} alt="" className="size-full rounded-card object-cover" />
      {capa && <span className="absolute bottom-2 left-2 rounded-full bg-ink/80 px-2.5 py-0.5 text-xs text-paper">Capa</span>}
      <button
        type="button"
        onClick={onRemove}
        aria-label={capa ? "Remover a foto de capa" : "Remover foto"}
        className="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full bg-ink text-paper transition-transform duration-(--dur-micro) active:scale-95 motion-reduce:transition-none"
      >
        <X className="size-4" aria-hidden />
      </button>
    </li>
  );
}
