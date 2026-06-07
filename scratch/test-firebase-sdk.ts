import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/lib/firebase";

async function test() {
  try {
    console.log("Initializing Firestore fetch via Client SDK...");
    const docRef = doc(db, "cms", "landing_ecosistema");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Fetch SUCCESS!");
      console.log("Hero title:", docSnap.data()?.hero?.title);
    } else {
      console.log("Document does not exist!");
    }
  } catch (e) {
    console.error("Fetch FAILED with error:", e);
  }
}

test().then(() => process.exit(0));
