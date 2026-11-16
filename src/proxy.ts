import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ehAdmin } from "@/lib/admin";

// Barreira otimista; a checagem real (loja_id) acontece em cada página/rota via lib/session.
// Aqui também a sessão é renovada: o cookie novo só pode ser gravado fora do render das páginas.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { headers, response: sessao } = await auth.api.getSession({ headers: request.headers, returnHeaders: true });
  if (!sessao) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }
  // /admin: quem não está em ADMIN_EMAILS recebe um 404 seco, sem a casca da rota.
  if (pathname.startsWith("/admin") && !ehAdmin(sessao.user.email)) {
    return new NextResponse("Página não encontrada", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const res = NextResponse.next();
  for (const cookie of headers.getSetCookie()) res.headers.append("set-cookie", cookie);
  return res;
}

export const config = {
  matcher: ["/painel/:path*", "/admin/:path*", "/onboarding"],
};
