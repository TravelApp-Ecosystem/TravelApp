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

async function inspectConversations() {
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

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  
  const queryPayload = {
    structuredQuery: {
      from: [{ collectionId: 'conversations' }],
      orderBy: [{
        field: { fieldPath: 'lastMessageAt' },
        direction: 'DESCENDING'
      }],
      limit: 3
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryPayload)
    });
    
    const data = await res.json();
    console.log('Last 3 Conversations:');
    for (const item of data || []) {
      if (item.document) {
        console.log('--------------------------------------------');
        console.log('Doc Name:', item.document.name);
        console.log('Fields:', JSON.stringify(item.document.fields, null, 2));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectConversations();
