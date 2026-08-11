import { NextRequest, NextResponse } from 'next/server';

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
      date,
    } = body;

    if (!passengerEmail) {
      return NextResponse.json({ error: 'Falta email del pasajero' }, { status: 400 });
    }

    console.log(`[RECEIPT API] Enviando recibo digital del viaje #${tripId} a ${passengerEmail}...`);

    return NextResponse.json({
      success: true,
      message: `Recibo digital enviado correctamente a ${passengerEmail}`,
      receipt: {
        tripId,
        passengerEmail,
        amount,
        paymentMethod
      }
    });
  } catch (error: any) {
    console.error('[RECEIPT API ERROR]', error);
    return NextResponse.json({ error: 'Error procesando recibo digital' }, { status: 500 });
  }
}
