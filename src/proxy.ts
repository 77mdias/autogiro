import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Barreira otimista; a checagem real (loja_id) acontece em cada página/rota via lib/session.
export const proxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  if ((pathname.startsWith("/painel") || pathname === "/onboarding") && !request.auth) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }
});

export const config = {
  matcher: ["/painel/:path*", "/onboarding"],
};
