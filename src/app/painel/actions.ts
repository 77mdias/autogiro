"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { carros, lojas, membros, pedidosEdicao, simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { fotosAprovadas, MAX_FOTOS, type MudancasCarro } from "@/lib/pedidos";
import { detectFile, MAX_UPLOAD_BYTES } from "@/lib/files";
import { AsaasError, criarCheckoutAssinatura, faturaVencida } from "@/lib/asaas";
import { MAX_CENTAVOS, onlyDigits, reaisToCentavos, slugify } from "@/lib/masks";
import { deleteCnhs, deleteFotos, uploadFoto } from "@/lib/r2";
import { getLojaIdDoGestor, getMembro, lojaLiberada } from "@/lib/session";

// Server actions são endpoints públicos: toda action revalida a sessão e escopa por loja_id.

export type FormState = { error?: string } | undefined;

const uuid = z.uuid();
const anoAtual = new Date().getFullYear();

const carroSchema = z.object({
  marca: z.string().trim().min(1, "Informe a marca").max(40),
  modelo: z.string().trim().min(1, "Informe o modelo").max(80),
  ano: z.coerce.number().int().min(1950, "Ano inválido").max(anoAtual + 1, "Ano inválido"),
  km: z
    .string()
    .transform((v) => Number(onlyDigits(v) || 0))
    .refine((k) => k <= 2_000_000, "Quilometragem inválida"),
  preco: z
    .string()
    .transform(reaisToCentavos)
    .refine((c) => c > 0, "Informe o preço")
    .refine((c) => c <= MAX_CENTAVOS, "Preço acima do limite"),
  cambio: z.enum(["Manual", "Automático"]).optional(),
  combustivel: z.enum(["Flex", "Gasolina", "Etanol", "Diesel", "Elétrico", "Híbrido"]).optional(),
  cor: z.string().trim().max(30).optional(),
  descricao: z.string().trim().max(2000).optional(),
  status: z.enum(["disponivel", "vendido"]).default("disponivel"),
});

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
};

export async function salvarCarro(_prev: FormState, fd: FormData): Promise<FormState> {
  const membro = await getMembro();
  if (!membro) return { error: "Sessão expirada. Entre novamente." };
  const { lojaId } = membro;
  if (!(await lojaLiberada(lojaId))) return { error: "Plano pausado. Regularize a assinatura em Minha loja." };

  const parsed = carroSchema.safeParse({
    marca: str(fd, "marca"),
    modelo: str(fd, "modelo"),
    ano: str(fd, "ano"),
    km: str(fd, "km") ?? "",
    preco: str(fd, "preco") ?? "",
    cambio: str(fd, "cambio"),
    combustivel: str(fd, "combustivel"),
    cor: str(fd, "cor"),
    descricao: str(fd, "descricao"),
    status: str(fd, "status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const editId = str(fd, "id");
  if (editId && !uuid.safeParse(editId).success) return { error: "Carro não encontrado" };
  const carroId = editId ?? crypto.randomUUID();
  // Vendedor só cadastra direto; a edição dele vira pedido para o gestor aprovar
  const pedido = !!editId && membro.papel !== "gestor";
  if (pedido && (await pedidoPendente(editId, lojaId))) return { error: PEDIDO_PENDENTE };

  let fotosAtuais: string[] = [];
  if (editId) {
    const [atual] = await db
      .select({ fotos: carros.fotos })
      .from(carros)
      .where(and(eq(carros.id, editId), eq(carros.lojaId, lojaId)))
      .limit(1);
    if (!atual) return { error: "Carro não encontrado" };
    fotosAtuais = atual.fotos;
  }
  // Só remove chaves que já pertencem a este carro
  const remover = new Set(fd.getAll("removerFotos").filter((k) => fotosAtuais.includes(k as string)) as string[]);
  const mantidas = fotosAtuais.filter((k) => !remover.has(k));

  const novas = fd.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  if (mantidas.length + novas.length > MAX_FOTOS) return { error: `Máximo de ${MAX_FOTOS} fotos` };

  // Valida todas antes de enviar qualquer uma
  const arquivos = [];
  for (const file of novas) {
    if (file.size > MAX_UPLOAD_BYTES) return { error: "Cada foto deve ter até 5MB" };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const tipo = detectFile(bytes, ["image/jpeg", "image/png", "image/webp"]);
    if (!tipo) return { error: "Fotos devem ser JPG, PNG ou WEBP" };
    arquivos.push({ bytes, tipo });
  }

  const enviadas: string[] = [];
  try {
    for (const { bytes, tipo } of arquivos) {
      const key = `${lojaId}/${carroId}/${crypto.randomUUID()}.${tipo.ext}`;
      await uploadFoto(key, bytes, tipo.type);
      enviadas.push(key);
    }

    const { preco, ...resto } = parsed.data;
    const valores = { ...resto, precoCentavos: preco, fotos: [...mantidas, ...enviadas] };
    if (pedido) {
      const mudancas: MudancasCarro = {
        ...resto,
        precoCentavos: preco,
        cambio: resto.cambio ?? null,
        combustivel: resto.combustivel ?? null,
        cor: resto.cor ?? null,
        descricao: resto.descricao ?? null,
        fotosNovas: enviadas,
        fotosRemover: [...remover],
      };
      const [criado] = await db
        .insert(pedidosEdicao)
        .values({ lojaId, carroId, membroId: membro.membroId, tipo: "editar", mudancas })
        .onConflictDoNothing()
        .returning({ id: pedidosEdicao.id });
      if (!criado) {
        await deleteFotos(enviadas).catch(() => {});
        return { error: PEDIDO_PENDENTE };
      }
    } else if (editId) {
      await db.update(carros).set(valores).where(and(eq(carros.id, editId), eq(carros.lojaId, lojaId)));
    } else {
      await db.insert(carros).values({ ...valores, id: carroId, lojaId, cadastradoPor: membro.membroId });
    }
  } catch (err) {
    if (enviadas.length) await deleteFotos(enviadas).catch(() => {});
    console.error("salvarCarro", err);
    return { error: "Não deu para salvar o carro agora. Tente de novo em alguns segundos." };
  }

  if (remover.size && !pedido) await deleteFotos([...remover]).catch(() => {}); // órfã no bucket público não é crítica
  revalidatePath("/painel", "layout");
  redirect(pedido ? "/painel/pedidos" : "/painel/estoque");
}

const PEDIDO_PENDENTE = "Este carro já tem um pedido esperando o gestor.";

async function pedidoPendente(carroId: string, lojaId: string) {
  const [p] = await db
    .select({ id: pedidosEdicao.id })
    .from(pedidosEdicao)
    .where(and(eq(pedidosEdicao.carroId, carroId), eq(pedidosEdicao.lojaId, lojaId), eq(pedidosEdicao.status, "pendente")))
    .limit(1);
  return !!p;
}

/** Exclui o carro e as fotos. As simulações ficam (carro_id vira null) para a loja ainda responder. */
export async function excluirCarro(id: string): Promise<FormState> {
  const membro = await getMembro();
  if (!membro || !uuid.safeParse(id).success) return { error: "Carro não encontrado" };
  const { lojaId } = membro;

  if (membro.papel !== "gestor") {
    const [carro] = await db.select({ id: carros.id }).from(carros).where(and(eq(carros.id, id), eq(carros.lojaId, lojaId))).limit(1);
    if (!carro) return { error: "Carro não encontrado" };
    const [criado] = await db
      .insert(pedidosEdicao)
      .values({ lojaId, carroId: id, membroId: membro.membroId, tipo: "excluir" })
      .onConflictDoNothing()
      .returning({ id: pedidosEdicao.id });
    if (!criado) return { error: PEDIDO_PENDENTE };
    revalidatePath("/painel", "layout");
    redirect("/painel/pedidos");
  }

  const [apagado] = await db
    .delete(carros)
    .where(and(eq(carros.id, id), eq(carros.lojaId, lojaId)))
    .returning({ fotos: carros.fotos });
  if (!apagado) return { error: "Carro não encontrado" };

  if (apagado.fotos.length) await deleteFotos(apagado.fotos).catch(() => {}); // órfã no bucket público não é crítica
  revalidatePath("/painel", "layout");
  redirect("/painel/estoque");
}

const lojaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da loja").max(80),
  whatsapp: z
    .string()
    .transform(onlyDigits)
    .refine((d) => d.length === 10 || d.length === 11, "WhatsApp com DDD, ex.: (11) 98765-4321"),
});

const lojaCampos = (fd: FormData) => ({
  nome: str(fd, "nome"),
  whatsapp: str(fd, "whatsapp") ?? "",
});

export async function salvarLoja(_prev: FormState, fd: FormData): Promise<FormState> {
  const lojaId = await getLojaIdDoGestor();
  if (!lojaId) return { error: "Só o gestor altera os dados da loja." };
  const parsed = lojaSchema.safeParse(lojaCampos(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.update(lojas).set(parsed.data).where(eq(lojas.id, lojaId));
  revalidatePath("/painel", "layout");
  return {};
}

export async function criarLoja(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await auth();
  if (!session) return { error: "Sessão expirada. Entre novamente." };
  if (session.user.loja_id) redirect("/painel");

  const parsed = lojaSchema.safeParse(lojaCampos(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Sufixo aleatório evita colisão de slug; o slug não muda ao renomear (link da vitrine estável).
  const slug = `${slugify(parsed.data.nome) || "loja"}-${crypto.randomUUID().slice(0, 4)}`;
  // Conflito = duplo envio; a loja já criada vale. O jwt callback (lib/auth) acha o gestor e põe o loja_id na sessão.
  await db.transaction(async (tx) => {
    const [loja] = await tx
      .insert(lojas)
      .values({ ...parsed.data, slug, authUserId: session.user.id! })
      .onConflictDoNothing({ target: lojas.authUserId })
      .returning({ id: lojas.id });
    if (loja) await tx.insert(membros).values({ lojaId: loja.id, authUserId: session.user.id!, papel: "gestor" });
  });

  redirect("/painel/estoque");
}

/**
 * Assinatura: manda para o Checkout de cartão do Asaas, onde o pagador informa os próprios dados.
 * A primeira cobrança cai no fim do teste grátis (ou hoje, se já acabou). Quem decide o plano é o webhook.
 */
export async function assinar(): Promise<FormState> {
  const lojaId = await getLojaIdDoGestor();
  if (!lojaId) return { error: "Só o gestor cuida da assinatura." };
  const [loja] = await db.select().from(lojas).where(eq(lojas.id, lojaId)).limit(1);
  if (!loja) return { error: "Loja não encontrada" };
  if (loja.planoStatus === "ativo") return {};
  if (process.env.ASAAS_CHECKOUT !== "on") return { error: "A assinatura é feita com a equipe AutoGiro por enquanto." };

  let destino: string | null;
  try {
    if (loja.asaasSubscriptionId) {
      // Já assinou: com atraso, o caminho é pagar a fatura vencida, não abrir outra assinatura.
      destino = await faturaVencida(loja.asaasSubscriptionId);
      if (!destino) return { error: "Sua assinatura já está registrada. Se o painel continuar pausado, fale com o suporte." };
    } else {
      const hoje = new Date();
      const checkout = await criarCheckoutAssinatura({
        lojaId,
        primeiraCobranca: loja.trialAte > hoje ? loja.trialAte : hoje,
        voltarPara: `${process.env.APP_BASE_URL}/painel/loja`,
      });
      // O webhook CHECKOUT_PAID acha a loja por este id e grava o cliente que o Asaas criou.
      await db.update(lojas).set({ asaasCheckoutId: checkout.id }).where(eq(lojas.id, lojaId));
      destino = checkout.url;
    }
  } catch (err) {
    if (err instanceof AsaasError) return { error: `O Asaas recusou: ${err.message}` };
    throw err;
  }
  redirect(destino);
}

// Leads: só o responsável age (WhatsApp, CNH, descartar). O gestor lê os dos vendedores, mas não mexe.
const doResponsavel = (id: string, m: { lojaId: string; membroId: string }) =>
  and(eq(sim.id, id), eq(sim.lojaId, m.lojaId), eq(sim.responsavelId, m.membroId));

export async function excluirSimulacao(id: string): Promise<FormState> {
  const membro = await getMembro();
  if (!membro || !uuid.safeParse(id).success) return { error: "Não encontrado" };

  const [row] = await db.select({ cnhKey: sim.cnhKey }).from(sim).where(doResponsavel(id, membro)).limit(1);
  if (!row) return { error: "Não encontrado" };

  // Apaga a CNH antes da linha: se o R2 falhar, o registro continua e o cron ainda acha o arquivo.
  if (row.cnhKey && !(await deleteCnhs([row.cnhKey])).includes(row.cnhKey)) {
    return { error: "Não foi possível excluir a CNH. Tente novamente." };
  }
  await db.delete(sim).where(doResponsavel(id, membro));
  revalidatePath("/painel", "layout");
  return {};
}

/** Tira o lead do contador de "novas" quando o garagista age sobre ele. */
export async function marcarContato(id: string) {
  const membro = await getMembro();
  if (!membro || !uuid.safeParse(id).success) return;
  await db
    .update(sim)
    .set({ status: "em_contato" })
    .where(and(doResponsavel(id, membro), eq(sim.status, "novo")));
  revalidatePath("/painel", "layout");
}

/** O gestor passa um lead dele para um vendedor ativo da mesma loja. Depois disso, o lead é do vendedor. */
export async function distribuirLead(fd: FormData) {
  const membro = await getMembro();
  const id = String(fd.get("id"));
  const para = String(fd.get("para"));
  if (membro?.papel !== "gestor" || !uuid.safeParse(id).success || !uuid.safeParse(para).success) return;
  const [vendedor] = await db
    .select({ id: membros.id })
    .from(membros)
    .where(and(eq(membros.id, para), eq(membros.lojaId, membro.lojaId), eq(membros.papel, "vendedor"), eq(membros.ativo, true)))
    .limit(1);
  if (!vendedor) return;
  await db.update(sim).set({ responsavelId: vendedor.id }).where(doResponsavel(id, membro));
  revalidatePath("/painel", "layout");
}

export async function sair() {
  await signOut({ redirectTo: "/" });
}

/** Gestor aprova: aplica a edição (ou exclui o carro) e marca o pedido, tudo numa transação. */
export async function aprovarPedido(id: string): Promise<FormState> {
  const gestor = await getMembro();
  if (gestor?.papel !== "gestor" || !uuid.safeParse(id).success) return { error: "Pedido não encontrado" };
  const [p] = await db
    .select()
    .from(pedidosEdicao)
    .where(and(eq(pedidosEdicao.id, id), eq(pedidosEdicao.lojaId, gestor.lojaId), eq(pedidosEdicao.status, "pendente")))
    .limit(1);
  if (!p) return { error: "Este pedido já foi decidido." };

  const [carro] = p.carroId
    ? await db
        .select({ fotos: carros.fotos })
        .from(carros)
        .where(and(eq(carros.id, p.carroId), eq(carros.lojaId, gestor.lojaId)))
        .limit(1)
    : [];
  if (!carro) {
    await recusarPedido(id);
    return { error: "O carro não está mais no estoque; o pedido foi recusado." };
  }

  let fotos: string[] | null = null;
  if (p.tipo === "editar") {
    fotos = fotosAprovadas(carro.fotos, p.mudancas!);
    if (!fotos) return { error: `Com este pedido o carro passaria de ${MAX_FOTOS} fotos. Recuse e peça um novo.` };
  }

  const aplicado = await db.transaction(async (tx) => {
    const [marcado] = await tx
      .update(pedidosEdicao)
      .set({ status: "aprovado", decididoPor: gestor.membroId, decididoEm: new Date() })
      .where(and(eq(pedidosEdicao.id, id), eq(pedidosEdicao.status, "pendente")))
      .returning({ id: pedidosEdicao.id });
    if (!marcado) return false;
    const doCarro = and(eq(carros.id, p.carroId!), eq(carros.lojaId, gestor.lojaId));
    if (fotos) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- separa as fotos dos campos do carro
      const { fotosNovas, fotosRemover, ...campos } = p.mudancas!;
      await tx.update(carros).set({ ...campos, fotos }).where(doCarro);
    } else {
      await tx.delete(carros).where(doCarro);
    }
    return true;
  });
  if (!aplicado) return { error: "Este pedido já foi decidido." };

  const sairam = carro.fotos.filter((k) => !fotos?.includes(k));
  if (sairam.length) await deleteFotos(sairam).catch(() => {}); // órfã no bucket público não é crítica
  revalidatePath("/painel", "layout");
  return {};
}

/** Gestor recusa: o carro fica como está e as fotos que o vendedor subiu saem do R2. */
export async function recusarPedido(id: string): Promise<FormState> {
  const gestor = await getMembro();
  if (gestor?.papel !== "gestor" || !uuid.safeParse(id).success) return { error: "Pedido não encontrado" };
  const [p] = await db
    .update(pedidosEdicao)
    .set({ status: "recusado", decididoPor: gestor.membroId, decididoEm: new Date() })
    .where(and(eq(pedidosEdicao.id, id), eq(pedidosEdicao.lojaId, gestor.lojaId), eq(pedidosEdicao.status, "pendente")))
    .returning({ mudancas: pedidosEdicao.mudancas });
  if (!p) return { error: "Este pedido já foi decidido." };
  if (p.mudancas?.fotosNovas.length) await deleteFotos(p.mudancas.fotosNovas).catch(() => {});
  revalidatePath("/painel", "layout");
  return {};
}
