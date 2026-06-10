import { fetchCmsData } from "@/lib/firestore-rest";
import RewardsLandingClient from "./RewardsLandingClient";

export const dynamic = "force-dynamic";

export default async function RewardsLandingPage() {
  const initialCms = await fetchCmsData("landing_rewards");
  return <RewardsLandingClient initialCms={initialCms} />;
}
