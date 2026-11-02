import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Túnel do ngrok (webhooks do Asaas em dev); o plano grátis usa estes domínios
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app"],
  partialPrefetching: true,
  experimental: {
    // Fotos chegam já reduzidas no cliente; limite cobre até ~10 fotos por envio
    serverActions: { bodySizeLimit: "12mb" },
    proxyClientMaxBodySize: "12mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
