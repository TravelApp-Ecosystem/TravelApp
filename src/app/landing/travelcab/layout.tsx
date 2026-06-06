import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TravelCab",
  icons: {
    icon: "/assets/favicom.png",
    apple: "/assets/favicom.png",
  },
};

export default function LandingTravelCabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
