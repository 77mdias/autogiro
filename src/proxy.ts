import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ehAdmin } from "@/lib/admin";

// Barreira otimista; a checagem real (loja_id) acontece em cada página/rota via lib/session.
export const proxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  if ((pathname.startsWith("/painel") || pathname.startsWith("/admin") || pathname === "/onboarding") && !request.auth) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }
  // /admin: quem não está em ADMIN_EMAILS recebe um 404 seco, sem a casca da rota. Sem rewrite: o
  // auth() troca a origem de request.url pelo AUTH_URL, e o rewrite viraria proxy externo.
  if (pathname.startsWith("/admin") && !ehAdmin(request.auth?.user?.email)) {
    return new NextResponse("Página não encontrada", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
});

export const config = {
  matcher: ["/painel/:path*", "/admin/:path*", "/onboarding"],
};
