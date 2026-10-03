import { fetchCmsData } from "@/lib/firestore-rest";
import OtaMarketplaceClient from "./OtaMarketplaceClient";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const initialCms = await fetchCmsData("landing_ecosistema");
  return <OtaMarketplaceClient initialCms={initialCms} />;
}
