import * as admin from 'firebase-admin';

// Inicializar Firebase Admin usando las credenciales del proyecto de forma explícita
if (!admin.apps.length) {
  try {
    // Si tenemos la private key de la cuenta de servicio configurada (opcional en el futuro)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Como alternativa segura para leer/escribir sin gRPC en Vercel,
      // inicializamos usando el projectId que está configurado
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin:', error);
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
