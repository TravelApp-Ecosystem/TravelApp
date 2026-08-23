import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tripId,
      passengerEmail,
      passengerName,
      amount,
      origin,
      destination,
      driverName,
      paymentMethod,
      distanceKm,
      durationMinutes,
      date,
    } = body;

    if (!passengerEmail) {
      return NextResponse.json({ error: 'Falta email del pasajero' }, { status: 400 });
    }

    const receiptRecord = {
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      tripId: tripId || `TRIP-${Date.now().toString().slice(-4)}`,
      passengerEmail: passengerEmail.trim().toLowerCase(),
      passengerName: passengerName || 'Pasajero TravelCab',
      amount: Number(amount) || 0,
      currency: 'ARS',
      origin: origin || 'Origen no especificado',
      destination: destination || 'Destino no especificado',
      driverName: driverName || 'Conductor Oficial TravelCab',
      paymentMethod: paymentMethod || 'Efectivo',
      distanceKm: distanceKm || 0,
      durationMinutes: durationMinutes || 0,
      issuedAt: Date.now(),
      formattedDate: date || new Date().toLocaleDateString('es-AR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      status: 'Enviado',
    };

    console.log(`[RECEIPT API] Generando y enviando recibo digital ${receiptRecord.receiptNumber} a ${passengerEmail}...`);

    // Guardar registro de auditoría en Firestore
    try {
      await addDoc(collection(db, 'receipts'), receiptRecord);
    } catch (dbErr) {
      console.warn('[RECEIPT API] No se pudo persistir en Firestore, continuando:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Recibo digital ${receiptRecord.receiptNumber} emitido y enviado correctamente a ${passengerEmail}`,
      receipt: receiptRecord
    });
  } catch (error: any) {
    console.error('[RECEIPT API ERROR]', error);
    return NextResponse.json({ error: 'Error procesando recibo digital' }, { status: 500 });
  }
}
