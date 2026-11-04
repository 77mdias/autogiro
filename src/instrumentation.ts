// Roda uma vez quando o servidor sobe, antes da primeira requisição.
export async function register() {
  // Migração ao subir só nos nossos containers (MIGRAR_AO_SUBIR=1 no compose): lá o servidor é um processo só.
  // Na Vercel cada instância de função passaria por aqui; lá a migração roda uma vez por deploy, no build
  // (scripts/vercel-build.sh). Só no Node (o import some do bundle Edge) e nunca no `next build`.
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.MIGRAR_AO_SUBIR === "1" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { migrarAoSubir } = await import("@/lib/db/migrar");
    await migrarAoSubir();
  }
}
