import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lojas, webhookEvents } from "@/lib/db/schema";
import { verifyHmacSha256 } from "@/lib/signature";

// shortcut: nome do header, formato da assinatura e nomes de eventos seguem um contrato HMAC-SHA256
// genérico; confirme com a documentação/suporte da Appmax antes de ir para produção.
const SIGNATURE_HEADER = "x-appmax-signature";

type AppmaxPayload = { event?: string; data?: { id?: string | number; customer_id?: string | number } };

const STATUS_POR_EVENTO: Record<string, (typeof lojas.$inferSelect)["planoStatus"]> = {
  OrderPaid: "ativo",
  OrderApproved: "ativo",
  OrderRefund: "cancelado",
  OrderChargeBack: "cancelado",
  PaymentNotAuthorized: "inadimplente",
  OrderOverdue: "inadimplente",
};

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyHmacSha256(raw, request.headers.get(SIGNATURE_HEADER), process.env.APPMAX_WEBHOOK_SECRET ?? "")) {
    return Response.json({ error: "assinatura inválida" }, { status: 401 });
  }

  let payload: AppmaxPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "json inválido" }, { status: 400 });
  }

  const eventType = payload.event ?? "unknown";
  const eventKey =
    payload.data?.id != null ? `${eventType}:${payload.data.id}` : createHash("sha256").update(raw).digest("hex");

  // Registro do evento e efeito na mesma transação: se o processamento falhar, o rollback remove o
  // registro e a Appmax pode reenviar. Duplicatas concorrentes esperam o índice único e caem no conflito.
  const duplicado = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(webhookEvents)
      .values({ provider: "appmax", eventKey, eventType, payload })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });
    if (inserted.length === 0) return true;

    const novoStatus = STATUS_POR_EVENTO[eventType];
    const customerId = payload.data?.customer_id;
    if (novoStatus && customerId != null) {
      await tx.update(lojas).set({ planoStatus: novoStatus }).where(eq(lojas.appmaxCustomerId, String(customerId)));
    }
    return false;
  });

  return Response.json({ ok: true, duplicado });
}
