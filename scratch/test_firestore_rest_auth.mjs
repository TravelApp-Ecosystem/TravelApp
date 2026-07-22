import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
);

async function testFirestoreRestAuth() {
  const projectId = 'mvp-travelapp';
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  console.log('1. Signing in anonymously via Auth REST API...');
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  
  try {
    const authRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    });
    
    const authData = await authRes.json();
    const idToken = authData.idToken;
    
    console.log('2. Fetching travisConfig/main via Firestore REST API with token...');
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/travisConfig/main`;
    
    const firestoreRes = await fetch(firestoreUrl, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    console.log('Firestore Status:', firestoreRes.status);
    const firestoreData = await firestoreRes.json();
    console.log('Firestore Data:', JSON.stringify(firestoreData, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testFirestoreRestAuth();
