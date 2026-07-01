import { db as clientDb } from './firebase';
import { 
  collection as clientCollection, 
  doc as clientDoc, 
  getDoc as clientGetDoc, 
  getDocs as clientGetDocs, 
  addDoc as clientAddDoc, 
  updateDoc as clientUpdateDoc, 
  setDoc as clientSetDoc,
  query as clientQuery,
  where as clientWhere,
  orderBy as clientOrderBy,
  limit as clientLimit,
  QueryConstraint
} from 'firebase/firestore';

import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

let adminDb: any = null;
let authPromise: Promise<any> | null = null;

const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountVar && typeof window === 'undefined') {
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountVar))
      });
    }
    adminDb = admin.firestore();
  } catch (error) {
    console.error('Error initializing firebase-admin:', error);
  }
}

async function ensureAuthenticated() {
  if (typeof window !== 'undefined') return; // Solo en el servidor
  if (adminDb) return; // Si el SDK Admin está activo, no necesitamos autenticación de cliente
  if (auth.currentUser) return; // Ya está autenticado
  
  if (authPromise) return authPromise;

  authPromise = (async () => {
    // 1. Intentar iniciar sesión con usuario bot si las credenciales están configuradas
    const botEmail = process.env.TRAVIS_BOT_EMAIL;
    const botPassword = process.env.TRAVIS_BOT_PASSWORD;
    if (botEmail && botPassword) {
      try {
        await signInWithEmailAndPassword(auth, botEmail, botPassword);
        console.log('[Auth] Servidor autenticado exitosamente como bot');
        return;
      } catch (err) {
        console.error('[Auth] Error al iniciar sesión como bot:', err);
      }
    }

    // 2. Fallback: Intentar inicio de sesión anónimo
    try {
      await signInAnonymously(auth);
      console.log('[Auth] Servidor autenticado anónimamente');
    } catch (err) {
      console.error('[Auth] Error de inicio de sesión anónimo en el servidor:', err);
    }
  })();

  return authPromise;
}

export async function serverGetDoc(collectionName: string, docId: string): Promise<{ exists: boolean; data: () => any; id: string }> {
  if (adminDb) {
    try {
      const snap = await adminDb.collection(collectionName).doc(docId).get();
      return {
        exists: snap.exists,
        data: () => snap.data(),
        id: snap.id
      };
    } catch (err) {
      console.error(`Firebase Admin serverGetDoc error for ${collectionName}/${docId}:`, err);
      throw err;
    }
  } else {
    await ensureAuthenticated();
    const docSnap = await clientGetDoc(clientDoc(clientDb, collectionName, docId));
    return {
      exists: docSnap.exists(),
      data: () => docSnap.data(),
      id: docSnap.id
    };
  }
}

export async function serverGetDocs(
  collectionName: string, 
  constraints: { where?: [string, any, any][]; orderBy?: [string, any][]; limit?: number } = {}
): Promise<{ empty: boolean; docs: any[] }> {
  if (adminDb) {
    try {
      let query = adminDb.collection(collectionName);
      if (constraints.where) {
        for (const [field, op, val] of constraints.where) {
          query = query.where(field, op === '==' ? '==' : op, val);
        }
      }
      if (constraints.orderBy) {
        for (const [field, dir] of constraints.orderBy) {
          query = query.orderBy(field, dir);
        }
      }
      if (constraints.limit) {
        query = query.limit(constraints.limit);
      }
      const snap = await query.get();
      const docs = snap.docs.map((d: any) => ({
        id: d.id,
        data: () => d.data()
      }));
      return {
        empty: snap.empty,
        docs
      };
    } catch (err) {
      console.error(`Firebase Admin serverGetDocs error for ${collectionName}:`, err);
      throw err;
    }
  } else {
    // Client SDK
    await ensureAuthenticated();
    let clientRef: any = clientCollection(clientDb, collectionName);
    const clientConstraints: QueryConstraint[] = [];
    if (constraints.where) {
      for (const [field, op, val] of constraints.where) {
        clientConstraints.push(clientWhere(field, op as any, val));
      }
    }
    if (constraints.orderBy) {
      for (const [field, dir] of constraints.orderBy) {
        clientConstraints.push(clientOrderBy(field, dir));
      }
    }
    if (constraints.limit) {
      clientConstraints.push(clientLimit(constraints.limit));
    }
    
    const clientQueryInstance = clientQuery(clientRef, ...clientConstraints);
    const snap = await clientGetDocs(clientQueryInstance);
    return {
      empty: snap.empty,
      docs: snap.docs.map(d => ({
        id: d.id,
        data: () => d.data()
      }))
    };
  }
}

export async function serverAddDoc(collectionName: string, data: any): Promise<{ id: string }> {
  if (adminDb) {
    try {
      const ref = await adminDb.collection(collectionName).add(data);
      return { id: ref.id };
    } catch (err) {
      console.error(`Firebase Admin serverAddDoc error for ${collectionName}:`, err);
      throw err;
    }
  } else {
    await ensureAuthenticated();
    const ref = await clientAddDoc(clientCollection(clientDb, collectionName), data);
    return { id: ref.id };
  }
}

export async function serverUpdateDoc(collectionName: string, docId: string, data: any): Promise<void> {
  if (adminDb) {
    try {
      await adminDb.collection(collectionName).doc(docId).update(data);
    } catch (err) {
      console.error(`Firebase Admin serverUpdateDoc error for ${collectionName}/${docId}:`, err);
      throw err;
    }
  } else {
    await ensureAuthenticated();
    await clientUpdateDoc(clientDoc(clientDb, collectionName, docId), data);
  }
}

export async function serverSetDoc(collectionName: string, docId: string, data: any): Promise<void> {
  if (adminDb) {
    try {
      await adminDb.collection(collectionName).doc(docId).set(data, { merge: true });
    } catch (err) {
      console.error(`Firebase Admin serverSetDoc error for ${collectionName}/${docId}:`, err);
      throw err;
    }
  } else {
    await ensureAuthenticated();
    await clientSetDoc(clientDoc(clientDb, collectionName, docId), data, { merge: true });
  }
}
