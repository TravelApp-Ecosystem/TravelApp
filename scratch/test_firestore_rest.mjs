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

function convertToFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value) ? { integerValue: value.toString() } : { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => {
            if (typeof v === 'string') return { stringValue: v };
            if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: v.toString() } : { doubleValue: v };
            if (typeof v === 'object') return { mapValue: { fields: convertToFirestoreFields(v) } };
            return v;
          })
        }
      };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: convertToFirestoreFields(value) } };
    }
  }
  return fields;
}

async function testFirestoreCreate() {
  const projectId = 'mvp-travelapp';
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
  console.log('Testing creating a conversation document via REST API...');
  
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/conversations?key=${apiKey}`;
  
  const testData = {
    participants: [
      { id: '12345', name: 'Test User', role: 'customer' },
      { id: 'travis', name: 'Travis', role: 'travis' }
    ],
    status: 'bot',
    channel: 'whatsapp',
    manyChatSubscriberId: '12345',
    lastMessage: 'Ping REST API',
    lastMessageAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: convertToFirestoreFields(testData) })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testFirestoreCreate();
