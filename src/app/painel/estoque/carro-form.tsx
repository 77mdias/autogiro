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

export function CarroForm({ carro }: { carro?: CarroInicial }) {
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

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5">
      {carro && <input type="hidden" name="id" value={carro.id} />}

      <section aria-label="Fotos" className="grid grid-cols-1 gap-2">
        <span className="text-body-md font-medium">Fotos</span>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-2 pb-1">
          <label className="flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input bg-popover text-caption font-medium focus-within:ring-3 focus-within:ring-ring/50">
            <Camera className="size-6" aria-hidden />
            {processando ? "Preparando…" : "Adicionar"}
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
          {existentes.map((f) => (
            <Thumb key={f.key} src={f.url} onRemove={() => setRemovidas((s) => new Set(s).add(f.key))} />
          ))}
          {novas.map((n, i) => (
            <Thumb key={n.preview} src={n.preview} onRemove={() => setNovas((a) => a.filter((_, j) => j !== i))} />
          ))}
        </div>
        <p className="text-caption text-muted-foreground">A primeira foto é a capa na vitrine.</p>
      </section>

      <Field label="Marca" htmlFor="marca">
        <Input id="marca" name="marca" list="marcas" required autoComplete="off" defaultValue={carro?.marca} />
        <datalist id="marcas">{MARCAS.map((m) => <option key={m} value={m} />)}</datalist>
      </Field>

      <Field label="Modelo" htmlFor="modelo">
        <Input id="modelo" name="modelo" required placeholder="Ex.: Onix LT 1.0 Turbo" defaultValue={carro?.modelo} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ano" htmlFor="ano">
          <Input id="ano" name="ano" inputMode="numeric" pattern="\d{4}" maxLength={4} required placeholder="2022" defaultValue={carro?.ano} />
        </Field>
        <Field label="KM" htmlFor="km">
          <MaskedInput id="km" name="km" mask="milhar" required placeholder="45.000" defaultValue={carro ? String(carro.km) : ""} />
        </Field>
      </div>

      <Field label="Preço" htmlFor="preco">
        <MaskedInput
          id="preco"
          name="preco"
          mask="milhar"
          prefix="R$"
          required
          placeholder="65.900"
          defaultValue={carro ? String(Math.round(carro.precoCentavos / 100)) : ""}
        />
      </Field>

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

      <Field label="Observações" htmlFor="descricao">
        <Textarea id="descricao" name="descricao" rows={3} placeholder="Único dono, revisões em dia…" defaultValue={carro?.descricao ?? ""} />
      </Field>

      {carro && (
        <PillGroup
          name="status"
          legend="Status"
          options={[{ value: "disponivel", label: "Disponível" }, { value: "vendido", label: "Vendido" }]}
          defaultValue={carro.status}
        />
      )}

      <FormError message={state?.error} />
      <Button type="submit" size="lg" disabled={pending || processando} className="w-full">
        {pending ? "Salvando…" : carro ? "Salvar alterações" : "Cadastrar carro"}
      </Button>
    </form>
  );
}

function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative size-24 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- preview local/R2 */}
      <img src={src} alt="" className="size-full rounded-md object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover foto"
        className="absolute -top-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-foreground text-background"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
