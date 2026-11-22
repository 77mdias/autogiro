import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// /api/auth/*: callback do Google (/api/auth/callback/google, o mesmo do Auth.js) e rotas do Better Auth.
export const { GET, POST } = toNextJsHandler(auth);
