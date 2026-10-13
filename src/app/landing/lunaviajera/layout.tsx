import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luna Viajera · Excursiones Locales & Experiencias de Cercanía",
  description: "Viví lo extraordinario cerca tuyo. Trekking guiado, cascadas secretas, astroturismo y sabores regionales con Luna Viajera.",
  icons: {
    icon: [
      { url: "/assets/luna_viajera_favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/assets/luna_viajera_gold.png", sizes: "1024x1024", type: "image/png" },
    ],
    shortcut: "/assets/luna_viajera_favicon.png",
    apple: "/assets/luna_viajera_gold.png",
  },
};

export default function LandingLunaViajeraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
