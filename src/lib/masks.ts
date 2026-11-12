// Sem imports com alias: este arquivo roda direto no `node --test`.

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** "11987654321" → "(11) 98765-4321" (aceita fixo com 10 dígitos). */
export function formatPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const split = d.length === 11 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, split)}${d.length > split ? `-${d.slice(split)}` : ""}`;
}

/** Inteiro com separador de milhar: "45000" → "45.000". Usado para reais (sem centavos) e km. */
export function formatMilhar(value: string) {
  const d = onlyDigits(value).replace(/^0+(?=\d)/, "").slice(0, 9);
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Campo em reais inteiros → centavos. "45.000" → 4500000. */
export const reaisToCentavos = (value: string) => Number(onlyDigits(value) || 0) * 100;

/** Teto de valores em reais (R$ 10 milhões): cabe no `integer` do Postgres em centavos. */
export const MAX_CENTAVOS = 1_000_000_000;

export function slugify(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Identidade do WhatsApp para o teste grátis: DDD + 8 últimos dígitos. Com ou sem o 9 da frente é o mesmo número.
 * Celular e fixo não colidem: depois do DDD, celular começa em 6 a 9 e fixo em 2 a 5.
 */
export function chaveWhatsapp(value: string) {
  const d = onlyDigits(value);
  return d.slice(0, 2) + d.slice(-8);
}

export function whatsappUrl(phoneDigits: string, text?: string) {
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/55${onlyDigits(phoneDigits)}${q}`;
}
