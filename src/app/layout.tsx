import type { Metadata, Viewport } from "next";
import { Geologica } from "next/font/google";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

// SHRP: os cantos afiados do tema Vantage, ligados só nos títulos (globals.css)
const geologica = Geologica({ subsets: ["latin"], axes: ["SHRP"], variable: "--font-geologica", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AutoGiro", template: "%s | AutoGiro" },
  description: "Vitrine online do estoque, contato por WhatsApp e simulações de financiamento para lojas de seminovos.",
  appleWebApp: { capable: true, title: "AutoGiro", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f8f9fc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geologica.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Revelações só escondem conteúdo quando há script (landing.css usa .js) */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
