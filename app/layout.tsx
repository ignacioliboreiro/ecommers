import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";

import { DemoModeBanner } from "@/src/modules/layout/components/demo-mode-banner";
import { TouchActiveFix } from "@/src/modules/layout/components/touch-active-fix";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Voltio — Electrónica",
    template: "%s · Voltio",
  },
  description:
    "Smartphones, notebooks, audio, wearables, gaming y cámaras. Electrónica elegida con criterio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-grain">
        {/*
          Va en el root layout y no en app/(storefront)/layout.tsx porque la home
          (app/page.tsx) vive en la raíz y no usa ese layout: ahí el banner nunca
          aparecía, justo en la página por la que entra cualquier visitante.
          Acá lo hereda todo, incluido el panel admin — que el dueño de la tienda
          vea el modo de su instalación es deseable, no un efecto colateral.
        */}
        <TouchActiveFix />
        <DemoModeBanner />
        {children}
      </body>
    </html>
  );
}
