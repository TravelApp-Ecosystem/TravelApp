import { fetchCmsData } from "@/lib/firestore-rest";
import ExperienceMarketplaceClient from "./ExperienceMarketplaceClient";

export const dynamic = "force-dynamic";

export default async function ExperienceMarketplacePage() {
  const initialCms = await fetchCmsData("landing_experience");
  return <ExperienceMarketplaceClient initialCms={initialCms} />;
}
