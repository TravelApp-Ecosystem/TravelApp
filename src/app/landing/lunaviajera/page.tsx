import { fetchCmsData } from "@/lib/firestore-rest";
import LunaViajeraLandingClient from "./LunaViajeraLandingClient";

export const dynamic = "force-dynamic";

export default async function LunaViajeraPage() {
  const initialCms = await fetchCmsData("landing_lunaviajera");
  return <LunaViajeraLandingClient initialCms={initialCms} />;
}
