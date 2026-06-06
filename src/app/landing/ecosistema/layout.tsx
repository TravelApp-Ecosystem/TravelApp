import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travelapp",
  icons: {
    icon: "/assets/favicom.png",
    apple: "/assets/favicom.png",
  },
};

export default function LandingEcosistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
