"use server";

import { and, count, eq, gt, gte, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { carros, convites, lojas, membros, pedidosEdicao, simulacoesFinanciamento as sim, testesWhatsapp, usuarios, vendas } from "@/lib/db/schema";
import { fotosAprovadas, MAX_FOTOS, type MudancasCarro } from "@/lib/pedidos";
import { detectFile, MAX_UPLOAD_BYTES } from "@/lib/files";
import { AsaasError, cancelarAssinatura, criarCheckoutAssinatura, faturaVencida, mudarValorAssinatura } from "@/lib/asaas";
import { arquivosDaLoja, confirmouExclusao, contaDeEmail } from "@/lib/exclusao";
import { chaveWhatsapp, MAX_CENTAVOS, onlyDigits, reaisToCentavos, slugify } from "@/lib/masks";
import { deleteCnhs, deleteFotos, uploadFoto } from "@/lib/r2";
import { getLojaIdDoGestor, getMembro, getSession, lojaLiberada, type Membro } from "@/lib/session";
import { MAX_VENDEDORES, valorPlano } from "@/lib/plano";
import { hashToken, novoToken } from "@/lib/senha";

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
  let statusAtual: "disponivel" | "vendido" = "disponivel";
  if (editId) {
    const [atual] = await db
      .select({ fotos: carros.fotos, status: carros.status })
      .from(carros)
      .where(and(eq(carros.id, editId), eq(carros.lojaId, lojaId)))
      .limit(1);
    if (!atual) return { error: "Carro não encontrado" };
    fotosAtuais = atual.fotos;
    statusAtual = atual.status;
  }

  // Virou vendido: a venda precisa do valor. O gestor também diz quem vendeu (padrão: ele mesmo);
  // no pedido do vendedor, quem vendeu é quem pediu.
  let venda: Venda | undefined;
  if (editId && parsed.data.status === "vendido" && statusAtual !== "vendido") {
    const valorCentavos = reaisToCentavos(str(fd, "valorVenda") ?? "");
    if (valorCentavos <= 0 || valorCentavos > MAX_CENTAVOS) return { error: "Informe por quanto o carro foi vendido." };
    let membroId = membro.membroId;
    const escolhido = str(fd, "vendidoPor");
    if (!pedido && escolhido && escolhido !== membroId) {
      if (!uuid.safeParse(escolhido).success || !(await membroAtivo(escolhido, lojaId))) return { error: "Escolha quem vendeu" };
      membroId = escolhido;
    }
    venda = { valorCentavos, membroId };
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
        ...(venda && { venda: { valorCentavos: venda.valorCentavos } }),
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
      await db.transaction(async (tx) => {
        await tx.update(carros).set(valores).where(and(eq(carros.id, editId), eq(carros.lojaId, lojaId)));
        await ajustarVenda(tx, { lojaId, carroId: editId, antes: statusAtual, depois: resto.status, carro: nomeCarro(resto), venda });
      });
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

type Venda = { valorCentavos: number; membroId: string };
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const nomeCarro = (c: { marca: string; modelo: string; ano: number }) => `${c.marca} ${c.modelo} ${c.ano}`;

async function membroAtivo(id: string, lojaId: string) {
  const [m] = await db
    .select({ id: membros.id })
    .from(membros)
    .where(and(eq(membros.id, id), eq(membros.lojaId, lojaId), eq(membros.ativo, true)))
    .limit(1);
  return !!m;
}

/** A venda acompanha a situação do carro: virou vendido → registra; voltou a disponível → desfaz. */
async function ajustarVenda(
  tx: Tx,
  a: { lojaId: string; carroId: string; antes: string; depois: string; carro: string; venda?: Venda },
) {
  if (a.depois === "vendido" && a.antes !== "vendido" && a.venda) {
    await tx
      .insert(vendas)
      .values({ lojaId: a.lojaId, carroId: a.carroId, carro: a.carro, ...a.venda })
      .onConflictDoNothing();
  } else if (a.depois === "disponivel" && a.antes === "vendido") {
    await tx.delete(vendas).where(and(eq(vendas.carroId, a.carroId), eq(vendas.lojaId, a.lojaId)));
  }
}

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

/**
 * Marca o WhatsApp como já usado num teste grátis. true = o número é desta loja (novo ou já dela);
 * false = outra loja teve teste com ele antes.
 */
async function registrarWhatsapp(tx: Tx, whatsapp: string, lojaId: string) {
  const chave = chaveWhatsapp(whatsapp);
  const [novo] = await tx.insert(testesWhatsapp).values({ chave, lojaId }).onConflictDoNothing().returning({ chave: testesWhatsapp.chave });
  if (novo) return true;
  const [dono] = await tx.select({ lojaId: testesWhatsapp.lojaId }).from(testesWhatsapp).where(eq(testesWhatsapp.chave, chave)).limit(1);
  return dono?.lojaId === lojaId;
}

const lojaCampos = (fd: FormData) => ({
  nome: str(fd, "nome"),
  whatsapp: str(fd, "whatsapp") ?? "",
});

export async function salvarLoja(_prev: FormState, fd: FormData): Promise<FormState> {
  const lojaId = await getLojaIdDoGestor();
  if (!lojaId) return { error: "Só o gestor altera os dados da loja." };
  const parsed = lojaSchema.safeParse(lojaCampos(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const erro = await db.transaction(async (tx) => {
    const [loja] = await tx
      .select({ planoStatus: lojas.planoStatus, sub: lojas.asaasSubscriptionId })
      .from(lojas)
      .where(eq(lojas.id, lojaId))
      .limit(1);
    const doTeste = await registrarWhatsapp(tx, parsed.data.whatsapp, lojaId);
    // Em teste grátis, trocar para o WhatsApp de outra loja seria o jeito de ganhar um segundo teste.
    if (!doTeste && loja?.planoStatus === "trial" && !loja.sub)
      return "Esse WhatsApp já usou o teste grátis em outra loja. Para usá-lo aqui, assine o plano.";
    await tx.update(lojas).set(parsed.data).where(eq(lojas.id, lojaId));
  });
  if (erro) return { error: erro };
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
  const comTeste = await db.transaction(async (tx) => {
    const [loja] = await tx
      .insert(lojas)
      .values({ ...parsed.data, slug, authUserId: session.user.id! })
      .onConflictDoNothing({ target: lojas.authUserId })
      .returning({ id: lojas.id });
    if (!loja) return true;
    await tx.insert(membros).values({ lojaId: loja.id, authUserId: session.user.id!, papel: "gestor" });
    if (await registrarWhatsapp(tx, parsed.data.whatsapp, loja.id)) return true;
    // Um teste grátis por WhatsApp: a loja nasce, mas para usar o painel e a vitrine precisa assinar.
    await tx.update(lojas).set({ trialAte: sql`now()` }).where(eq(lojas.id, loja.id));
    return false;
  });

  redirect(comTeste ? "/painel/estoque" : "/painel/loja");
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
        valorReais: valorPlano(await vendedoresAtivos(lojaId)),
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

/**
 * Exclui a conta de quem está logado. Vendedor: sai da loja e a carteira volta ao gestor. Gestor: apaga a
 * loja inteira (cascata), depois de cancelar a assinatura no Asaas. Fica só o WhatsApp em testes_whatsapp.
 */
export async function excluirConta(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!confirmouExclusao(String(fd.get("confirmacao") ?? ""))) return { error: "Digite EXCLUIR para confirmar." };
  const sub = (await getSession())?.user.id;
  const membro = await getMembro();
  // Sem membro: já excluída (clique duplo ou outra aba).
  if (sub && membro?.papel === "vendedor") await excluirVendedor(membro);
  if (sub && membro?.papel === "gestor") {
    const erro = await excluirLoja(membro.lojaId);
    if (erro) return { error: erro };
  }
  if (sub && contaDeEmail(sub)) await db.delete(usuarios).where(eq(usuarios.id, sub));
  await signOut({ redirectTo: "/login?aviso=excluida" });
  return {};
}

async function excluirVendedor({ lojaId, membroId }: Membro) {
  const fotos = await db.transaction(async (tx) => {
    const [gestor] = await tx
      .select({ id: membros.id })
      .from(membros)
      .where(and(eq(membros.lojaId, lojaId), eq(membros.papel, "gestor")))
      .limit(1);
    if (gestor) await devolverCarteira(tx, lojaId, membroId, gestor.id);
    // Pedidos pendentes dele somem em cascata; as fotos novas desses pedidos já estão no R2.
    const pedidos = await tx
      .select({ mudancas: pedidosEdicao.mudancas })
      .from(pedidosEdicao)
      .where(and(eq(pedidosEdicao.membroId, membroId), eq(pedidosEdicao.status, "pendente")));
    await tx.delete(membros).where(and(eq(membros.id, membroId), eq(membros.lojaId, lojaId)));
    return arquivosDaLoja([], pedidos.flatMap((p) => (p.mudancas ? [p.mudancas] : [])));
  });
  if (fotos.length) await deleteFotos(fotos).catch((err) => console.error("Fotos não apagadas do R2", { lojaId, fotos, err }));
  await ajustarMensalidade(lojaId);
}

/** Apaga a loja. Devolve a mensagem de erro se o Asaas não cancelar a assinatura (aí nada é apagado). */
async function excluirLoja(lojaId: string): Promise<string | undefined> {
  const [loja] = await db.select({ sub: lojas.asaasSubscriptionId }).from(lojas).where(eq(lojas.id, lojaId)).limit(1);
  if (loja?.sub) {
    try {
      await cancelarAssinatura(loja.sub);
    } catch (err) {
      console.error("Assinatura não cancelada no Asaas", { lojaId, err });
      return "Não deu para cancelar a assinatura no Asaas. Tente de novo em alguns minutos.";
    }
    // Já cancelada: se algo falhar daqui em diante, a nova tentativa não cancela de novo.
    await db.update(lojas).set({ asaasSubscriptionId: null }).where(eq(lojas.id, lojaId));
  }
  const [doCarros, doPedidos, cnhs] = await Promise.all([
    db.select({ fotos: carros.fotos }).from(carros).where(eq(carros.lojaId, lojaId)),
    db.select({ mudancas: pedidosEdicao.mudancas }).from(pedidosEdicao).where(eq(pedidosEdicao.lojaId, lojaId)),
    db.select({ key: sim.cnhKey }).from(sim).where(and(eq(sim.lojaId, lojaId), isNotNull(sim.cnhKey))),
  ]);
  // Cascata: carros, simulações, membros, convites, pedidos e vendas; testes_whatsapp.loja_id vira null.
  await db.delete(lojas).where(eq(lojas.id, lojaId));
  const fotos = arquivosDaLoja(doCarros.map((c) => c.fotos), doPedidos.flatMap((p) => (p.mudancas ? [p.mudancas] : [])));
  const chavesCnh = cnhs.flatMap((c) => (c.key ? [c.key] : []));
  // A conta já sumiu: falha no R2 só vai para o log, com as chaves para limpar à mão.
  await Promise.all([fotos.length && deleteFotos(fotos), chavesCnh.length && deleteCnhs(chavesCnh)]).catch((err) =>
    console.error("Arquivos não apagados do R2", { lojaId, fotos, chavesCnh, err }),
  );
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
        .select({ fotos: carros.fotos, status: carros.status })
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- separa fotos e venda dos campos do carro
      const { fotosNovas, fotosRemover, venda, ...campos } = p.mudancas!;
      await tx.update(carros).set({ ...campos, fotos }).where(doCarro);
      await ajustarVenda(tx, {
        lojaId: gestor.lojaId,
        carroId: p.carroId!,
        antes: carro.status,
        depois: campos.status,
        carro: nomeCarro(campos),
        venda: venda && { valorCentavos: venda.valorCentavos, membroId: p.membroId },
      });
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

// ── Equipe ──────────────────────────────────────────────────────────────────

const PRAZO_CONVITE = 7 * 24 * 60 * 60_000;
const LOJA_CHEIA = `A loja já tem ${MAX_VENDEDORES} vendedores (contando convites em aberto). Fale com a AutoGiro para passar disso.`;

/** Vendedores ativos: é o que define a faixa da mensalidade (convite em aberto não paga). */
async function vendedoresAtivos(lojaId: string) {
  const [{ ativos }] = await db
    .select({ ativos: count() })
    .from(membros)
    .where(and(eq(membros.lojaId, lojaId), eq(membros.papel, "vendedor"), eq(membros.ativo, true)));
  return ativos;
}

/** Vagas ocupadas: vendedores ativos mais convites ainda válidos. */
async function vagasUsadas(lojaId: string) {
  const [ativos, [{ abertos }]] = await Promise.all([
    vendedoresAtivos(lojaId),
    db
      .select({ abertos: count() })
      .from(convites)
      .where(and(eq(convites.lojaId, lojaId), gt(convites.expiraEm, new Date()))),
  ]);
  return ativos + abertos;
}

/**
 * Mudou a equipe: se a faixa mudou, a assinatura no Asaas passa ao novo valor a partir da próxima cobrança.
 * Falha no Asaas não desfaz a mudança na equipe: a coluna segue com o valor antigo, Minha loja mostra a
 * diferença e `pnpm loja mensalidades aplicar` acerta depois.
 */
async function ajustarMensalidade(lojaId: string) {
  const [loja] = await db
    .select({ sub: lojas.asaasSubscriptionId, atual: lojas.mensalidadeCentavos })
    .from(lojas)
    .where(eq(lojas.id, lojaId))
    .limit(1);
  if (!loja?.sub) return;
  const reais = valorPlano(await vendedoresAtivos(lojaId));
  if (loja.atual === reais * 100) return;
  try {
    await mudarValorAssinatura(loja.sub, reais);
    await db.update(lojas).set({ mensalidadeCentavos: reais * 100 }).where(eq(lojas.id, lojaId));
  } catch (err) {
    console.error("Mensalidade não atualizada no Asaas", { lojaId, reais, err });
  }
}

export type ConviteState = { error?: string; link?: string } | undefined;

/** Gera um link de convite de uso único. O token só aparece nesta resposta; o banco guarda o hash. */
export async function convidarVendedor(_prev: ConviteState, fd: FormData): Promise<ConviteState> {
  const gestor = await getMembro();
  if (gestor?.papel !== "gestor") return { error: "Só o gestor convida vendedores." };
  const nome = z.string().trim().min(2, "Informe o nome do vendedor").max(60).safeParse(fd.get("nome") ?? "");
  if (!nome.success) return { error: nome.error.issues[0].message };
  if ((await vagasUsadas(gestor.lojaId)) >= MAX_VENDEDORES) return { error: LOJA_CHEIA };

  const { token, tokenHash } = novoToken();
  await db.insert(convites).values({
    lojaId: gestor.lojaId,
    nome: nome.data,
    tokenHash,
    expiraEm: new Date(Date.now() + PRAZO_CONVITE),
    criadoPor: gestor.membroId,
  });
  revalidatePath("/painel/vendedores");
  return { link: `/convite/${token}` };
}

export async function cancelarConvite(id: string) {
  const gestor = await getMembro();
  if (gestor?.papel !== "gestor" || !uuid.safeParse(id).success) return;
  await db.delete(convites).where(and(eq(convites.id, id), eq(convites.lojaId, gestor.lojaId)));
  revalidatePath("/painel/vendedores");
}

/** Desativa e devolve ao gestor os carros e clientes do vendedor (senão ninguém poderia agir sobre eles). */
/** Carros e clientes de um membro passam para outro (vendedor que sai: voltam ao gestor). */
async function devolverCarteira(tx: Tx, lojaId: string, de: string, para: string) {
  await tx.update(carros).set({ cadastradoPor: para }).where(and(eq(carros.lojaId, lojaId), eq(carros.cadastradoPor, de)));
  await tx.update(sim).set({ responsavelId: para }).where(and(eq(sim.lojaId, lojaId), eq(sim.responsavelId, de)));
}

export async function desativarVendedor(id: string): Promise<FormState> {
  const gestor = await getMembro();
  if (gestor?.papel !== "gestor" || !uuid.safeParse(id).success) return { error: "Vendedor não encontrado" };
  const feito = await db.transaction(async (tx) => {
    const [v] = await tx
      .update(membros)
      .set({ ativo: false })
      .where(and(eq(membros.id, id), eq(membros.lojaId, gestor.lojaId), eq(membros.papel, "vendedor")))
      .returning({ id: membros.id });
    if (!v) return false;
    await devolverCarteira(tx, gestor.lojaId, v.id, gestor.membroId);
    return true;
  });
  if (!feito) return { error: "Vendedor não encontrado" };
  await ajustarMensalidade(gestor.lojaId);
  revalidatePath("/painel", "layout");
  return {};
}

export async function reativarVendedor(id: string): Promise<FormState> {
  const gestor = await getMembro();
  if (gestor?.papel !== "gestor" || !uuid.safeParse(id).success) return { error: "Vendedor não encontrado" };
  if ((await vagasUsadas(gestor.lojaId)) >= MAX_VENDEDORES) return { error: LOJA_CHEIA };
  const [v] = await db
    .update(membros)
    .set({ ativo: true })
    .where(and(eq(membros.id, id), eq(membros.lojaId, gestor.lojaId), eq(membros.papel, "vendedor")))
    .returning({ id: membros.id });
  if (!v) return { error: "Vendedor não encontrado" };
  await ajustarMensalidade(gestor.lojaId);
  revalidatePath("/painel", "layout");
  return {};
}

class ConviteRecusado extends Error {}

/**
 * Quem abriu o link entra na equipe como vendedor. O convite é gasto na mesma transação; se a conta
 * já é de outra loja, nada muda (uma conta, uma loja). Conta desativada nesta loja volta a ficar ativa.
 */
export async function aceitarConvite(token: string): Promise<FormState> {
  const session = await getSession();
  if (!session?.user.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/convite/${token}`)}`);
  if (session.user.loja_id) return { error: "Esta conta já faz parte de uma loja. Entre com outra conta para aceitar." };
  const authUserId = session.user.id;

  let lojaId: string;
  try {
    lojaId = await db.transaction(async (tx) => {
      const [c] = await tx
        .delete(convites)
        .where(and(eq(convites.tokenHash, hashToken(token)), gt(convites.expiraEm, new Date())))
        .returning({ lojaId: convites.lojaId, nome: convites.nome });
      if (!c) throw new ConviteRecusado("Este convite já foi usado ou venceu. Peça um novo ao gestor.");
      const [m] = await tx
        .insert(membros)
        .values({ lojaId: c.lojaId, authUserId, papel: "vendedor", nome: c.nome })
        .onConflictDoUpdate({
          target: membros.authUserId,
          set: { ativo: true, nome: c.nome },
          setWhere: and(eq(membros.lojaId, c.lojaId), eq(membros.papel, "vendedor")),
        })
        .returning({ id: membros.id });
      if (!m) throw new ConviteRecusado("Esta conta já faz parte de outra loja. Entre com outra conta para aceitar.");
      return c.lojaId;
    });
  } catch (err) {
    if (err instanceof ConviteRecusado) return { error: err.message };
    throw err;
  }
  await ajustarMensalidade(lojaId);
  // O jwt (lib/auth) acha o membro na próxima requisição: o painel já abre com a loja.
  redirect("/painel/estoque");
}

/** Só o gestor define a comissão, em reais; vazio volta a "não definida". Não passa do valor da venda. */
export async function salvarComissao(_prev: FormState, fd: FormData): Promise<FormState> {
  const gestor = await getMembro();
  const id = String(fd.get("id"));
  if (gestor?.papel !== "gestor" || !uuid.safeParse(id).success) return { error: "Venda não encontrada" };
  const texto = str(fd, "comissao");
  const comissaoCentavos = texto ? reaisToCentavos(texto) : null;
  const [v] = await db
    .update(vendas)
    .set({ comissaoCentavos })
    .where(
      and(
        eq(vendas.id, id),
        eq(vendas.lojaId, gestor.lojaId),
        comissaoCentavos == null ? undefined : gte(vendas.valorCentavos, comissaoCentavos),
      ),
    )
    .returning({ id: vendas.id });
  if (!v) return { error: "A comissão não pode passar do valor da venda." };
  revalidatePath("/painel/vendas");
  return {};
}
