import { fetchCmsData } from "@/lib/firestore-rest";
import ExperienceMarketplaceClient from "../landing/experience/marketplace/ExperienceMarketplaceClient";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const initialCms = await fetchCmsData("landing_experience");
  return <ExperienceMarketplaceClient initialCms={initialCms} />;
}
