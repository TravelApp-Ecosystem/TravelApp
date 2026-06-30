import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    firebase: { status: 'pending', durationMs: 0, error: null },
    gemini: { status: 'pending', durationMs: 0, error: null }
  };

  // 1. Test Firebase
  const startFirebase = Date.now();
  try {
    const docRef = doc(db, 'travisConfig', 'main');
    const docSnap = await getDoc(docRef);
    results.firebase.status = docSnap.exists() ? 'success' : 'not_found';
    results.firebase.durationMs = Date.now() - startFirebase;
  } catch (err: any) {
    results.firebase.status = 'failed';
    results.firebase.error = err.message || err.toString();
    results.firebase.durationMs = Date.now() - startFirebase;
  }

  // 2. Test Gemini API
  const startGemini = Date.now();
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping' }] }]
      }),
      signal: AbortSignal.timeout(5000) // Timeout after 5s to avoid complete hang
    });

    results.gemini.status = `http_${res.status}`;
    const data = await res.json();
    results.gemini.response = data;
    results.gemini.durationMs = Date.now() - startGemini;
  } catch (err: any) {
    results.gemini.status = 'failed';
    results.gemini.error = err.message || err.toString();
    results.gemini.durationMs = Date.now() - startGemini;
  }

  return NextResponse.json(results);
}
