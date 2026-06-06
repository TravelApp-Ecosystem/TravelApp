import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExperienceLandingClient from "./ExperienceLandingClient";

export const dynamic = "force-dynamic";

async function getCmsData() {
  try {
    const docRef = doc(db, "cms", "landing_experience");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {
    console.error("Error fetching experience CMS:", e);
  }
  return null;
}

export default async function ExperiencePage() {
  const initialCms = await getCmsData();
  return <ExperienceLandingClient initialCms={initialCms} />;
}
