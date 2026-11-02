import "server-only";
import { PLANO_VALOR_REAIS } from "@/lib/plano";

// API v3 do Asaas: https://docs.asaas.com — sandbox por padrão; em produção, ASAAS_API_URL=https://api.asaas.com/v3
const API_URL = process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3";

export class AsaasError extends Error {}

async function asaas<T>(path: string, body?: unknown): Promise<T> {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurada");
  const res = await fetch(API_URL + path, {
    method: body ? "POST" : "GET",
    headers: { access_token: key, "content-type": "application/json", "user-agent": "AutoGiro/1.0" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AsaasError(json?.errors?.[0]?.description ?? `Asaas respondeu ${res.status}`);
  return json as T;
}

/**
 * Checkout hospedado: sem `customer`/`customerData`, o pagador preenche nome, CPF/CNPJ e cartão na
 * página do Asaas, que cria o cliente e a assinatura mensal ao concluir.
 */
export async function criarCheckoutAssinatura(p: { lojaId: string; primeiraCobranca: Date; voltarPara: string }) {
  // "yyyy-MM-dd HH:mm:ss" no horário de Brasília
  const nextDueDate = p.primeiraCobranca.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const checkout = await asaas<{ id: string; link?: string | null }>("/checkouts", {
    billingTypes: ["CREDIT_CARD"],
    chargeTypes: ["RECURRENT"],
    minutesToExpire: 60,
    externalReference: p.lojaId,
    callback: { successUrl: `${p.voltarPara}?assinatura=ok`, cancelUrl: p.voltarPara, expiredUrl: p.voltarPara },
    items: [
      {
        name: "AutoGiro mensal",
        description: "Vitrine, estoque e simulações com CNH",
        quantity: 1,
        value: PLANO_VALOR_REAIS,
        imageBase64: LOGO_BASE64,
      },
    ],
    subscription: { cycle: "MONTHLY", nextDueDate },
  });
  const site = API_URL.includes("sandbox") ? "https://sandbox.asaas.com" : "https://asaas.com";
  return { id: checkout.id, url: checkout.link ?? `${site}/checkoutSession/show?id=${checkout.id}` };
}

/** Link de uma fatura vencida da assinatura, para pagar o atraso na página do Asaas. */
export async function faturaVencida(subscriptionId: string) {
  const { data } = await asaas<{ data: { invoiceUrl: string }[] }>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}/payments?status=OVERDUE`,
  );
  return data[0]?.invoiceUrl ?? null;
}

// public/mark.png reduzido a 96px; o item do checkout exige imagem
const LOGO_BASE64 = "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";
