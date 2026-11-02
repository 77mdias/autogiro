import { and, eq, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { lojas, webhookEvents } from "@/lib/db/schema";
import { verifyToken } from "@/lib/signature";

// Contrato: https://docs.asaas.com/docs/sobre-os-webhooks — o authToken configurado no webhook chega
// no header `asaas-access-token`; `id` do evento é estável entre reenvios (entrega "at least once").
// Configure o webhook com envio sequencial: a loja só é ligada ao cliente quando chega CHECKOUT_PAID.
type Recurso = { id?: string; customer?: string | null; subscription?: string | null; externalReference?: string | null };
type AsaasPayload = { id?: string; event?: string; payment?: Recurso; subscription?: Recurso; checkout?: Recurso };
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const STATUS_POR_PAGAMENTO: Record<string, (typeof lojas.$inferSelect)["planoStatus"]> = {
  PAYMENT_CONFIRMED: "ativo",
  PAYMENT_RECEIVED: "ativo",
  PAYMENT_OVERDUE: "inadimplente",
  PAYMENT_REFUNDED: "cancelado",
  PAYMENT_CHARGEBACK_REQUESTED: "cancelado",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// A loja vai no externalReference do checkout; se o Asaas repassar para a assinatura, serve de reserva.
const porReferencia = (ref?: string | null) => (ref && UUID.test(ref) ? eq(lojas.id, ref) : undefined);

async function processar(tx: Tx, p: AsaasPayload) {
  const event = p.event!;

  if (event === "CHECKOUT_PAID" && p.checkout) {
    const { id, customer, externalReference } = p.checkout;
    const onde = or(id ? eq(lojas.asaasCheckoutId, id) : undefined, porReferencia(externalReference));
    if (customer && onde) await tx.update(lojas).set({ asaasCustomerId: customer }).where(and(onde, isNull(lojas.asaasCustomerId)));
    return;
  }

  if (event === "SUBSCRIPTION_CREATED" && p.subscription?.id) {
    const { id, customer, externalReference } = p.subscription;
    const onde = or(customer ? eq(lojas.asaasCustomerId, customer) : undefined, porReferencia(externalReference));
    if (onde) {
      await tx
        .update(lojas)
        .set({ asaasSubscriptionId: id, ...(customer && { asaasCustomerId: customer }) })
        .where(and(onde, isNull(lojas.asaasSubscriptionId)));
    }
    return;
  }

  if ((event === "SUBSCRIPTION_INACTIVATED" || event === "SUBSCRIPTION_DELETED") && p.subscription?.id) {
    // Solta a assinatura para a loja poder assinar de novo pelo checkout.
    await tx
      .update(lojas)
      .set({ planoStatus: "cancelado", asaasSubscriptionId: null })
      .where(eq(lojas.asaasSubscriptionId, p.subscription.id));
    return;
  }

  const novoStatus = STATUS_POR_PAGAMENTO[event];
  const pagamento = p.payment;
  // Só cobranças de assinatura mexem no plano; uma cobrança avulsa na mesma conta não conta.
  if (!novoStatus || !pagamento?.subscription) return;
  const sub = pagamento.subscription;
  // A assinatura já conhecida decide. Sem ela (pagamento chegou antes do SUBSCRIPTION_CREATED), vale o
  // cliente ou a referência, mas só para a primeira cobrança: estorno de uma assinatura já solta é ignorado.
  const conds: (SQL | undefined)[] = [eq(lojas.asaasSubscriptionId, sub)];
  if (novoStatus !== "cancelado") {
    const semAssinatura = isNull(lojas.asaasSubscriptionId);
    if (pagamento.customer) conds.push(and(eq(lojas.asaasCustomerId, pagamento.customer), semAssinatura));
    const ref = porReferencia(pagamento.externalReference);
    if (ref) conds.push(and(ref, semAssinatura));
  }
  await tx
    .update(lojas)
    .set({ planoStatus: novoStatus, asaasSubscriptionId: sub })
    .where(or(...conds));
}

export async function POST(request: Request) {
  if (!verifyToken(request.headers.get("asaas-access-token"), process.env.ASAAS_WEBHOOK_TOKEN)) {
    return Response.json({ error: "token inválido" }, { status: 401 });
  }

  let payload: AsaasPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "json inválido" }, { status: 400 });
  }
  if (!payload.id || !payload.event) return Response.json({ error: "evento sem id" }, { status: 400 });

  // Registro do evento e efeito na mesma transação: se o processamento falhar, o rollback remove o
  // registro, respondemos 500 e o Asaas reenvia. Duplicatas concorrentes esperam o índice único.
  const duplicado = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(webhookEvents)
      .values({ provider: "asaas", eventKey: payload.id!, eventType: payload.event!, payload })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });
    if (inserted.length === 0) return true;
    await processar(tx, payload);
    return false;
  });

  return Response.json({ ok: true, duplicado });
}
