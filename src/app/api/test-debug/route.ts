import { NextRequest, NextResponse } from 'next/server';
import { serverGetDoc } from '@/lib/firestore-server';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    adminSdkActive: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    auth: { status: 'pending', error: null },
    firebaseExperiences: { status: 'pending', durationMs: 0, error: null },
    firebaseConfig: { status: 'pending', durationMs: 0, error: null },
    gemini: { status: 'pending', durationMs: 0, error: null }
  };

  // 1. Test Firebase Configuration
  const firebaseConf = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 8)}...` : 'undefined',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'undefined',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'undefined',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? `${process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 10)}...` : 'undefined',
  };
  results.firebaseConfigRead = firebaseConf;

  // 2. Try Anonymous Auth (just for checking status)
  try {
    const authResult = await signInAnonymously(auth);
    results.auth.status = 'success';
    results.auth.uid = authResult.user.uid;
  } catch (err: any) {
    results.auth.status = 'failed';
    results.auth.error = err.message || err.toString();
  }

  // 3. Try serverGetDoc for experiences/TOUR-001
  const startExp = Date.now();
  try {
    const docSnap = await serverGetDoc('experiences', 'TOUR-001');
    results.firebaseExperiences.status = docSnap.exists ? 'success' : 'not_found';
    results.firebaseExperiences.durationMs = Date.now() - startExp;
    results.firebaseExperiences.data = docSnap.exists ? docSnap.data() : null;
  } catch (err: any) {
    results.firebaseExperiences.status = 'failed';
    results.firebaseExperiences.error = err.message || err.toString();
    results.firebaseExperiences.durationMs = Date.now() - startExp;
  }

  // 4. Try serverGetDoc for travisConfig/main
  const startConfig = Date.now();
  try {
    const docSnap = await serverGetDoc('travisConfig', 'main');
    results.firebaseConfig.status = docSnap.exists ? 'success' : 'not_found';
    results.firebaseConfig.durationMs = Date.now() - startConfig;
    results.firebaseConfig.data = docSnap.exists ? docSnap.data() : null;
  } catch (err: any) {
    results.firebaseConfig.status = 'failed';
    results.firebaseConfig.error = err.message || err.toString();
    results.firebaseConfig.durationMs = Date.now() - startConfig;
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
