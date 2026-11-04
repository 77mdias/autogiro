import type { Metadata, Viewport } from "next";
import { Rethink_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

const rethinkSans = Rethink_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rethink",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-jb",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "AutoGiro", template: "%s | AutoGiro" },
  description: "Vitrine online do estoque, contato por WhatsApp e simulações de financiamento para lojas de seminovos.",
  appleWebApp: { capable: true, title: "AutoGiro", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#080d18" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_BOOT_SCRIPT = `
document.documentElement.classList.add('js');
try {
  var m = localStorage.getItem('autogiro-theme');
  if (m === 'dark' || m === 'light') {
    document.documentElement.dataset.mode = m;
  }
} catch (e) {}
`.trim();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${rethinkSans.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inicializa classe .js e preferência de tema (claro/escuro) antes do primeiro paint */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
