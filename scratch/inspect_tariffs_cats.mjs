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

async function inspectTariffsAndCategories() {
  const projectId = 'mvp-travelapp';
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const authRes = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const authData = await authRes.json();
  const idToken = authData.idToken;

  try {
    // 1. Fetch categories
    const resCats = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/categories`, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    const catsData = await resCats.json();
    console.log('Categories:');
    for (const d of catsData.documents || []) {
      console.log(`- ID: ${d.name.split('/').pop()}, Fields:`, JSON.stringify(d.fields, null, 2));
    }

    // 2. Fetch tariffs
    const resTariffs = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/tariffs`, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    const tariffsData = await resTariffs.json();
    console.log('Tariffs:');
    for (const d of tariffsData.documents || []) {
      console.log(`- ID: ${d.name.split('/').pop()}, Fields:`, JSON.stringify(d.fields, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectTariffsAndCategories();
