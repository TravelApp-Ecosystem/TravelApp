import { fetchCmsData } from "@/lib/firestore-rest";
import ExperienceLandingClient from "./ExperienceLandingClient";

export const dynamic = "force-dynamic";

export default async function ExperiencePage() {
  const initialCms = await fetchCmsData("landing_experience");
  return <ExperienceLandingClient initialCms={initialCms} />;
}
