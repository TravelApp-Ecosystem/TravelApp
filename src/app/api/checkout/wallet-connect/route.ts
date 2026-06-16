import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST /api/checkout/wallet-connect
// Inicia el proceso de vinculación de billetera Mercado Pago (Wallet Connect) para el pasajero.
export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // En un entorno de producción real de Mercado Pago, aquí llamarías a la API de OAuth de MP
    // para generar la URL de autorización: https://auth.mercadopago.com/authorization?client_id=...
    // Para el MVP y pruebas en Sandbox, simularemos el portal seguro de autorización de MP.
    
    const simulatedAuthUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/mp-connect?userId=${userId}&email=${encodeURIComponent(email || '')}`;

    return NextResponse.json({
      url: simulatedAuthUrl,
      status: 'pending'
    });
  } catch (error: any) {
    console.error('[Wallet Connect Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
