import { fetchCmsData } from "@/lib/firestore-rest";
import EcosistemaLandingClient from "./EcosistemaLandingClient";

export const dynamic = "force-dynamic";

export default async function EcosistemaPage() {
  const initialCms = await fetchCmsData("landing_ecosistema");
  return <EcosistemaLandingClient initialCms={initialCms} />;
}
