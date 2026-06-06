import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TravelApp Rewards",
  icons: {
    icon: "/assets/favicom.png",
    apple: "/assets/favicom.png",
  },
};

export default function LandingRewardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
