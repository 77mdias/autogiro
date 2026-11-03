// Sem imports com alias: este arquivo roda direto no `node --test`.

/**
 * Dono do SaaS: e-mails em ADMIN_EMAILS (separados por vírgula). O e-mail da sessão já é verificado
 * (Google, ou conta de e-mail que só entra depois de confirmar). Lista vazia = ninguém é admin.
 */
export function ehAdmin(email: string | null | undefined, lista = process.env.ADMIN_EMAILS ?? "") {
  if (!email) return false;
  const alvo = email.trim().toLowerCase();
  return lista.split(",").some((e) => e.trim().toLowerCase() === alvo && alvo !== "");
}
