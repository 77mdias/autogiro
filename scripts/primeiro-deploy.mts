// Primeiro deploy do Worker (docs/deploy.md). Um Worker que ainda não existe não aceita segredos, e o deploy recusa
// segredo declarado sem valor: então os segredos vão junto, num --secrets-file. O arquivo leva só os nomes, sem valor;
// o cf usa o valor do ambiente (Criptenv) no lugar do valor do arquivo, então nenhum segredo vai para o disco.
// Depois disso, o deploy é do GitHub Actions e os segredos mudam pela integração do Criptenv com a Cloudflare.
//
//   pnpm exec cf auth login
//   criptenv run -e production -p <ID do projeto> -- node scripts/primeiro-deploy.mts
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

function rodar(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  return r.status ?? 1;
}

if (rodar("pnpm", ["db:migrate"]) !== 0) process.exit(1);
if (rodar("pnpm", ["build"]) !== 0) process.exit(1);

// `cf --secrets-file /dev/stdin` não funciona ("Could not read file"): precisa de um arquivo de verdade.
const pasta = mkdtempSync(join(tmpdir(), "autogiro-deploy-"));
const arquivo = join(pasta, "segredos.env");
writeFileSync(arquivo, segredos.map((nome) => `${nome}=`).join("\n") + "\n", { mode: 0o600 });
let status: number;
try {
  status = rodar("pnpm", ["exec", "cf", "deploy", "--prebuilt", "--mode", "production", "--secrets-file", arquivo]);
} finally {
  rmSync(pasta, { recursive: true, force: true });
}
process.exit(status);
