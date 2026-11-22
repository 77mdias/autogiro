// Primeiro deploy do Worker (docs/deploy.md). Um Worker que ainda não existe não aceita segredos, e o deploy recusa
// segredo declarado sem valor: então os valores vão junto, pelo stdin (nada em arquivo). Depois disso, o deploy é do
// GitHub Actions e os segredos mudam pela integração do Criptenv com a Cloudflare.
//
//   pnpm exec cf auth login
//   criptenv run -e production -p <ID do projeto> -- node scripts/primeiro-deploy.mts
import { spawnSync } from "node:child_process";
import { segredos } from "../cloudflare.config.ts";

const faltando = segredos.filter((nome) => !process.env[nome]);
if (faltando.length) {
  console.error(`Faltam no ambiente (production no Criptenv): ${faltando.join(", ")}`);
  process.exit(1);
}
if (!process.env.DATABASE_URL_DIRECT) {
  console.error("Falta DATABASE_URL_DIRECT (session pooler do Supabase de produção) para as migrações.");
  process.exit(1);
}

function rodar(cmd: string, args: string[], entrada?: string) {
  const r = spawnSync(cmd, args, { stdio: [entrada === undefined ? "inherit" : "pipe", "inherit", "inherit"], input: entrada });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

rodar("pnpm", ["db:migrate"]);
rodar("pnpm", ["build"]);
const valores = JSON.stringify(Object.fromEntries(segredos.map((nome) => [nome, process.env[nome]])));
rodar("pnpm", ["exec", "cf", "deploy", "--prebuilt", "--mode", "production", "--secrets-file", "/dev/stdin"], valores);
