const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  authDomain: "mvp-travelapp.firebaseapp.com",
  projectId: "mvp-travelapp",
  storageBucket: "mvp-travelapp.appspot.com",
  messagingSenderId: "308202390145",
  appId: "1:308202390145:web:..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanTestTrips() {
  console.log("Iniciando limpieza de viajes de prueba...");
  try {
    const q1 = query(collection(db, 'trips'), where('status', 'in', ['searching', 'requested', 'Buscando Chofer']));
    const snap = await getDocs(q1);
    console.log(`Encontrados ${snap.size} viajes pendientes de prueba.`);

    for (const docSnap of snap.docs) {
      console.log(`Cancelando viaje de prueba ID: ${docSnap.id}`);
      await updateDoc(doc(db, 'trips', docSnap.id), {
        status: 'cancelled',
        cancelledReason: 'Limpieza automática de viajes de prueba pre-lanzamiento',
        updatedAt: new Date()
      });
    }

    console.log("Limpieza de viajes finalizada exitosamente.");
  } catch (err) {
    console.error("Error limpiando viajes:", err);
  }
}

cleanTestTrips();
