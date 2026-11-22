import type { NextConfig } from "next";

// Lido pelo vinext (vite.config.ts); o build e o deploy são da Cloudflare (cloudflare.config.ts).
const nextConfig: NextConfig = {
  // Túnel do ngrok (webhooks do Asaas em dev); o plano grátis usa estes domínios
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app"],
  experimental: {
    // Fotos chegam já reduzidas no cliente; limite cobre até ~10 fotos por envio
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
