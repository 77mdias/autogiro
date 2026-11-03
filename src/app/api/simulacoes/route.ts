import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { carros, lojas, simulacoesFinanciamento } from "@/lib/db/schema";
import { detectFile, MAX_UPLOAD_BYTES } from "@/lib/files";
import { MAX_CENTAVOS, onlyDigits, reaisToCentavos } from "@/lib/masks";
import { planoLiberado } from "@/lib/plano";
import { deleteCnhs, uploadCnh } from "@/lib/r2";

const schema = z.object({
  carroId: z.uuid(),
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  telefone: z
    .string()
    .transform(onlyDigits)
    .refine((d) => d.length === 10 || d.length === 11, "WhatsApp com DDD"),
  valorEntrada: z.string().default("").transform(reaisToCentavos).refine((c) => c <= MAX_CENTAVOS, "Entrada acima do limite"),
  valorFinanciar: z
    .string()
    .transform(reaisToCentavos)
    .refine((c) => c > 0, "Informe o valor a financiar")
    .refine((c) => c <= MAX_CENTAVOS, "Valor a financiar acima do limite"),
  parcelas: z.coerce.number().pipe(z.union([z.literal(24), z.literal(36), z.literal(48), z.literal(60)], { error: "Escolha 24, 36, 48 ou 60 parcelas" })),
});

// Rota pública: o comprador envia a simulação + CNH. O loja_id vem SEMPRE do carro, nunca do cliente.
// shortcut: sem rate limit/captcha; adicionar (ex.: Cloudflare Turnstile) antes de divulgar em escala.
export async function POST(request: Request) {
  const form = await request.formData();
  const fields = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string" && v !== ""));
  if (fields.lgpd !== "on") return Response.json({ error: "É preciso autorizar o uso dos dados" }, { status: 400 });
  const parsed = schema.safeParse(fields);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { valorEntrada, valorFinanciar, ...data } = parsed.data;

  const [carro] = await db
    .select({ lojaId: carros.lojaId, planoStatus: lojas.planoStatus, trialAte: lojas.trialAte, asaasSubscriptionId: lojas.asaasSubscriptionId })
    .from(carros)
    .innerJoin(lojas, eq(lojas.id, carros.lojaId))
    .where(and(eq(carros.id, data.carroId), ne(carros.status, "vendido")))
    .limit(1);
  if (!carro || !planoLiberado(carro)) return Response.json({ error: "Este carro não está mais disponível" }, { status: 404 });

  const id = crypto.randomUUID();
  let cnhKey: string | null = null;
  const cnh = form.get("cnh");
  if (cnh instanceof File && cnh.size > 0) {
    if (cnh.size > MAX_UPLOAD_BYTES) return Response.json({ error: "CNH acima de 5MB" }, { status: 413 });
    const bytes = new Uint8Array(await cnh.arrayBuffer());
    const tipo = detectFile(bytes, ["image/jpeg", "image/png", "application/pdf"]);
    if (!tipo) return Response.json({ error: "CNH deve ser foto (JPG/PNG) ou PDF" }, { status: 415 });
    cnhKey = `${carro.lojaId}/${id}.${tipo.ext}`;
    await uploadCnh(cnhKey, bytes, tipo.type);
  }

  try {
    await db.insert(simulacoesFinanciamento).values({
      ...data,
      id,
      lojaId: carro.lojaId,
      valorEntradaCentavos: valorEntrada,
      valorFinanciarCentavos: valorFinanciar,
      consentimentoLgpdEm: new Date(),
      cnhKey,
      cnhUploadedAt: cnhKey ? new Date() : null,
    });
  } catch (err) {
    if (cnhKey) await deleteCnhs([cnhKey]).catch(() => {}); // não deixa CNH órfã no bucket
    throw err;
  }

  return Response.json({ ok: true, id }, { status: 201 });
}
