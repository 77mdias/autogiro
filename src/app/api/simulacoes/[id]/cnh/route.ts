import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { simulacoesFinanciamento as sim } from "@/lib/db/schema";
import { cnhSignedUrl } from "@/lib/r2";
import { getLojaId, lojaLiberada } from "@/lib/session";

// Gera, sob demanda, URL assinada (5 min) da CNH e redireciona — somente para o dono da loja.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const lojaId = await getLojaId();
  if (!lojaId) return Response.json({ error: "não autenticado" }, { status: 401 });
  if (!(await lojaLiberada(lojaId))) return Response.json({ error: "plano pausado" }, { status: 402 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "não encontrado" }, { status: 404 });
  const [row] = await db
    .select({ cnhKey: sim.cnhKey })
    .from(sim)
    .where(and(eq(sim.id, id), eq(sim.lojaId, lojaId)))
    .limit(1);
  // 404 também quando a simulação é de outra loja: não revela existência
  if (!row?.cnhKey) return Response.json({ error: "não encontrado" }, { status: 404 });

  return new Response(null, {
    status: 302,
    headers: { Location: await cnhSignedUrl(row.cnhKey), "Cache-Control": "no-store" },
  });
}
