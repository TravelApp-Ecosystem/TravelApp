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

async function fixExistingChannels() {
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
    const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/conversations`;
    const resList = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    const listData = await resList.json();
    
    console.log('Scanning conversations to fix channel values...');
    for (const d of listData.documents || []) {
      const id = d.name.split('/').pop();
      const fields = d.fields;
      const subId = fields.manyChatSubscriberId?.stringValue || '';
      
      // Si el subscriber_id es muy largo (como un ID de Facebook/Messenger de 16-17 dígitos)
      if (subId && subId.length > 12) {
        console.log(`Fixing conversation ${id} (subId: ${subId}) -> setting channel to messenger`);
        
        const updateUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/conversations/${id}?updateMask.fieldPaths=channel`;
        const resUpdate = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              channel: { stringValue: 'messenger' }
            }
          })
        });
        console.log(`Update status for ${id}:`, resUpdate.status);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

fixExistingChannels();
