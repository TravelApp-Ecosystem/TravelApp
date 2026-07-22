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

async function inspectMessages() {
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
      from: [{ collectionId: 'messages' }],
      orderBy: [{
        field: { fieldPath: 'timestamp' },
        direction: 'DESCENDING'
      }],
      limit: 5
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
    console.log('Last 5 Messages in entire DB:');
    for (const item of data || []) {
      if (item.document) {
        console.log('--------------------------------------------');
        console.log('Sender:', item.document.fields.sender?.mapValue?.fields?.name?.stringValue || 'unknown');
        console.log('Content:', item.document.fields.content?.stringValue);
        console.log('Timestamp:', item.document.fields.timestamp?.integerValue);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectMessages();
