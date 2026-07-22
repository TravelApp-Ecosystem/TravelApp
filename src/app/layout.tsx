import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";
import { MainLayout } from "@/components/layout/MainLayout";

const quicksand = { variable: "font-sans" };

export const metadata: Metadata = {
  title: "TravelApp Ecosystem",
  description: "Centro de Comando Global TravelApp",
  icons: {
    icon: "/assets/favicom.png",
    apple: "/assets/favicom.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isDashboard = host.includes("admin.") || host.includes("localhost") || host.includes("127.0.0.1");

  return (
    <html
      lang="es"
      className={`${quicksand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MainLayout isDashboard={isDashboard}>{children}</MainLayout>

        {/*
          ──────────────────────────────────────────────
          TRAVIS — ManyChat Webchat Widget
          Page ID: 4875357 (cuenta TravelApp)
          Cargado de forma diferida para no bloquear el render.
          Se activa en TODAS las rutas públicas automáticamente.
          Para desactivarlo en rutas específicas (ej. /login),
          el propio CSS lo oculta vía la clase .mcwidget-embed.
          ──────────────────────────────────────────────
        */}
        <Script
          src="//widget.manychat.com/4875357.js"
          strategy="afterInteractive"
          defer
        />
        <Script id="manychat-init" strategy="afterInteractive">
          {`window.mcAsyncInit = function () { ManyChat.init(); };`}
        </Script>
      </body>
    </html>
  );
}
