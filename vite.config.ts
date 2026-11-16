import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

export default defineConfig({
  plugins: [
    // next/image redimensionado pelo Cloudflare Images (binding IMAGES em cloudflare.config.ts)
    vinext({ images: { optimizer: imagesOptimizer() } }),
    cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } }),
  ],
  // Dev no container: escuta fora do localhost e aceita o túnel do ngrok (webhooks do Asaas, login do Google).
  server: { host: true, port: 3000, strictPort: true, allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app"] },
  preview: { host: true, port: 3000, strictPort: true, allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app"] },
});
