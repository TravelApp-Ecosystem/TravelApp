import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TravelApp Experience",
  icons: {
    icon: "/assets/favicom.png",
    apple: "/assets/favicom.png",
  },
};

export default function LandingExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
