// Que tipo de erro chegou à tela de erro, para dizer ao usuário o que aconteceu e o que fazer.
// Erros do servidor chegam ao navegador sem mensagem (só o `digest`, que casa com o log do Worker).

export type TipoErro = "offline" | "atualizacao" | "conexao" | "servidor";

const ATUALIZACAO = /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Importing a module script failed|error loading dynamically imported/i;
const CONEXAO = /Failed to fetch|NetworkError|Load failed|fetch failed|Network request failed|ERR_INTERNET_DISCONNECTED/i;

export function tipoDoErro(erro: unknown, online = true): TipoErro {
  if (!online) return "offline";
  const texto = erro instanceof Error ? `${erro.name} ${erro.message}` : String(erro ?? "");
  // Arquivo de uma versão anterior que não existe mais: houve deploy com a aba aberta.
  if (ATUALIZACAO.test(texto)) return "atualizacao";
  if (CONEXAO.test(texto)) return "conexao";
  return "servidor";
}

/** Código para o suporte achar o erro no log; só erros do servidor têm. */
export function codigoDoErro(erro: unknown): string | undefined {
  const digest = (erro as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest && !digest.startsWith("NEXT_") ? digest : undefined;
}
