import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import EcosistemaLandingClient from "./EcosistemaLandingClient";

export const dynamic = "force-dynamic";

async function getCmsData() {
  try {
    const docRef = doc(db, "cms", "landing_ecosistema");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {
    console.error("Error fetching ecosistema CMS:", e);
  }
  return null;
}

export default async function EcosistemaPage() {
  const initialCms = await getCmsData();
  return <EcosistemaLandingClient initialCms={initialCms} />;
}
