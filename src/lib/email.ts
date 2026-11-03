import "server-only";

// Resend por fetch (https://resend.com/docs/api-reference/emails/send-email), sem SDK.
// E-mail não lê CSS externo nem variáveis: as cores são os tokens do DESIGN.md convertidos para hex.
const COR = { paper: "#f8fafc", card: "#ffffff", ink: "#0e2036", ink2: "#364355", ink3: "#5a6472", rule: "#d9dee6", brand: "#006ce2", navy: "#0d2d56" };
const FONTE = "Geologica, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function layout({ titulo, texto, botao, link, rodape }: { titulo: string; texto: string; botao: string; link: string; rodape: string }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(titulo)}</title></head>
<body style="margin:0;background:${COR.paper};font-family:${FONTE};color:${COR.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.paper};padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${COR.card};border:1px solid ${COR.rule};border-radius:4px">
<tr><td style="padding:28px 32px 0;font-size:20px;letter-spacing:-0.02em"><span style="color:${COR.navy}">Auto</span><span style="color:${COR.brand}">Giro</span></td></tr>
<tr><td style="padding:24px 32px 8px;font-size:26px;line-height:1.25;font-weight:300">${esc(titulo)}</td></tr>
<tr><td style="padding:0 32px 24px;font-size:16px;line-height:1.6;color:${COR.ink2}">${esc(texto)}</td></tr>
<tr><td style="padding:0 32px 28px"><a href="${esc(link)}" style="display:inline-block;background:${COR.brand};color:#ffffff;text-decoration:none;font-size:16px;padding:14px 24px;border-radius:4px">${esc(botao)}</a></td></tr>
<tr><td style="padding:0 32px 28px;font-size:13px;line-height:1.6;color:${COR.ink3}">Se o botão não abrir, copie este endereço no navegador:<br><a href="${esc(link)}" style="color:${COR.brand};word-break:break-all">${esc(link)}</a></td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid ${COR.rule};font-size:13px;line-height:1.6;color:${COR.ink3}">${esc(rodape)}</td></tr>
</table></td></tr></table></body></html>`;
}

async function enviar(para: string, assunto: string, partes: Parameters<typeof layout>[0]) {
  const key = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_FROM;
  if (!key || !de) throw new Error("RESEND_API_KEY ou EMAIL_FROM não configurado");
  const texto = `${partes.titulo}\n\n${partes.texto}\n\n${partes.botao}: ${partes.link}\n\n${partes.rodape}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: de, to: [para], subject: assunto, html: layout(partes), text: texto }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

const base = () => process.env.APP_BASE_URL ?? "http://localhost:3000";

export const emailConfirmacao = (para: string, token: string) =>
  enviar(para, "Confirme seu e-mail no AutoGiro", {
    titulo: "Falta só confirmar seu e-mail",
    texto: "Você criou uma conta no AutoGiro. Confirme o e-mail para entrar no painel e montar a vitrine da sua loja. O link vale por 24 horas.",
    botao: "Confirmar e-mail",
    link: `${base()}/api/conta/confirmar?token=${token}`,
    rodape: "Não foi você? Ignore este e-mail: sem a confirmação, a conta não é ativada.",
  });

export const emailRedefinicao = (para: string, token: string) =>
  enviar(para, "Redefinir sua senha do AutoGiro", {
    titulo: "Crie uma senha nova",
    texto: "Recebemos um pedido para redefinir a senha da sua conta no AutoGiro. O link vale por 1 hora e só funciona uma vez.",
    botao: "Criar senha nova",
    link: `${base()}/redefinir-senha?token=${token}`,
    rodape: "Não pediu? Ignore este e-mail: sua senha continua a mesma.",
  });

export const emailContaExistente = (para: string) =>
  enviar(para, "Você já tem conta no AutoGiro", {
    titulo: "Este e-mail já tem conta",
    texto: "Alguém tentou criar uma conta no AutoGiro com este e-mail, mas ela já existe. Se foi você, é só entrar. Esqueceu a senha? Dá para criar uma nova na tela de entrada.",
    botao: "Entrar no AutoGiro",
    link: `${base()}/login`,
    rodape: "Não foi você? Pode ignorar este e-mail; nada mudou na sua conta.",
  });
