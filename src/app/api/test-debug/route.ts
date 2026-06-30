import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    auth: { status: 'pending', error: null },
    firebase: { status: 'pending', durationMs: 0, error: null },
    gemini: { status: 'pending', durationMs: 0, error: null }
  };

  // 1. Test Firebase Configuration
  const startFirebase = Date.now();
  const firebaseConf = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 8)}...` : 'undefined',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'undefined',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'undefined',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? `${process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 10)}...` : 'undefined',
  };
  results.firebaseConfigRead = firebaseConf;

  // 2. Try Anonymous Auth
  try {
    const authResult = await signInAnonymously(auth);
    results.auth.status = 'success';
    results.auth.uid = authResult.user.uid;
  } catch (err: any) {
    results.auth.status = 'failed';
    results.auth.error = err.message || err.toString();
  }

  // 3. Try Firestore Read
  try {
    const docRef = doc(db, 'experiences', 'TOUR-001');
    const docSnap = await getDoc(docRef);
    results.firebase.status = docSnap.exists() ? 'success' : 'not_found';
    results.firebase.durationMs = Date.now() - startFirebase;
    results.firebase.data = docSnap.exists() ? docSnap.data() : null;
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
