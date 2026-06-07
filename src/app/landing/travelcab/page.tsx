import { fetchCmsData } from "@/lib/firestore-rest";
import TravelCabLandingClient from "./TravelCabLandingClient";

export const dynamic = "force-dynamic";

export default async function TravelCabPage() {
  const initialCms = await fetchCmsData("landing_travelcab");
  return <TravelCabLandingClient initialCms={initialCms} />;
}
