import { and, inArray, isNotNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { deleteCnhs } from "@/lib/r2";
import { verifyBearer } from "@/lib/signature";

// Prazo de guarda da CNH. Defina com o jurídico; LGPD exige o mínimo necessário à finalidade.
const CNH_RETENTION_DAYS = 90;
const BATCH = 500;

export async function POST(request: Request) {
  if (!verifyBearer(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "não autorizado" }, { status: 401 });
  }

  const limite = new Date(Date.now() - CNH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let total = 0;

  for (;;) {
    const expirados = await db
      .select({ key: sim.cnhKey })
      .from(sim)
      .where(and(isNotNull(sim.cnhKey), lt(sim.cnhUploadedAt, limite)))
      .limit(BATCH);
    if (expirados.length === 0) break;

    // Apaga no R2 primeiro; só limpa no banco o que o R2 confirmou. Falhas ficam para a próxima execução.
    const deleted = await deleteCnhs(expirados.map((r) => r.key!));
    if (deleted.length === 0) break;
    await db.update(sim).set({ cnhKey: null, cnhUploadedAt: null }).where(inArray(sim.cnhKey, deleted));
    total += deleted.length;
    if (deleted.length < expirados.length) break;
  }

  return Response.json({ ok: true, excluidos: total });
}
