// Entrada do Worker na Cloudflare (cloudflare.config.ts). As páginas e rotas são do vinext; aqui só entra o que
// é do Worker: o escopo de banco por pedido (src/lib/db) e o cron diário que apaga as CNHs vencidas (LGPD).
import handler from "vinext/server/fetch-handler";
import { pedidoDb } from "@/lib/db";
import { apagarCnhsVencidas } from "@/lib/limpeza-cnh";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return pedidoDb.run({ url: env.HYPERDRIVE.connectionString }, () => handler.fetch(request, env, ctx));
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      pedidoDb.run({ url: env.HYPERDRIVE.connectionString }, async () => {
        console.log(`CNHs apagadas: ${await apagarCnhsVencidas()}`);
      }),
    );
  },
} satisfies ExportedHandler<Env>;
