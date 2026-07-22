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

async function inspectConversationMessages() {
  const projectId = 'mvp-travelapp';
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const conversationId = 'HaYAuLiBZy26FzRICDq2'; // User's Messenger conversation ID
  
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const authRes = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const authData = await authRes.json();
  const idToken = authData.idToken;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/conversations/${conversationId}/messages`;
  
  try {
    const res = await fetch(url + '?pageSize=50', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    const data = await res.json();
    console.log(`Messages in conversation ${conversationId}:`);
    const messages = (data.documents || []).map(doc => {
      const fields = doc.fields;
      return {
        sender: fields.sender?.mapValue?.fields?.name?.stringValue || 'unknown',
        role: fields.sender?.mapValue?.fields?.role?.stringValue || 'unknown',
        content: fields.content?.stringValue || '',
        timestamp: parseInt(fields.timestamp?.integerValue || '0', 10)
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    for (const msg of messages) {
      console.log(`[${new Date(msg.timestamp).toISOString()}] ${msg.sender} (${msg.role}): ${msg.content}`);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectConversationMessages();
