import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TravelCabLandingClient from "./TravelCabLandingClient";

export const dynamic = "force-dynamic";

async function getCmsData() {
  try {
    const docRef = doc(db, "cms", "landing_travelcab");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {
    console.error("Error fetching travelcab CMS:", e);
  }
  return null;
}

export default async function TravelCabPage() {
  const initialCms = await getCmsData();
  return <TravelCabLandingClient initialCms={initialCms} />;
}
