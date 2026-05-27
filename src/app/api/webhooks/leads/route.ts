import { NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Lead } from '@/types/crm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, phone, source, message } = body;

    if (!customerName || !source) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newLead: Omit<Lead, 'id'> = {
      customerName,
      phone: phone || '',
      origin: source,
      status: 'Nuevos',
      customerStatus: 'Prospecto',
      customerLevel: 1,
      businessUnit: 'TravelCab', // Default, can be adjusted based on needs
      chatHistory: message ? [
        {
          sender: 'Client',
          message: message,
          timestamp: Date.now(),
        }
      ] : [],
    };

    const docRef = await addDoc(collection(db, 'leads'), newLead);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error('Error processing lead webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
