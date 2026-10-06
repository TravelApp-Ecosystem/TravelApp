import { NextRequest, NextResponse } from 'next/server';
import { createNavePaymentIntent } from '@/lib/nave-client';
import { serverUpdateDoc } from '@/lib/firestore-server';

// POST /api/checkout/nave-intent
// Genera una intención de pago en NAVE (Banco Galicia / Naranja X) devolviendo el checkout_url y qr_data.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      externalPaymentId,
      amount,
      currency = 'ARS',
      productName,
      productDescription,
      buyer,
      reservationId,
      callbackUrl
    } = body;

    if (!externalPaymentId || !amount || !productName) {
      return NextResponse.json(
        { error: 'Campos requeridos: externalPaymentId, amount, productName' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'El monto ingresado es inválido' }, { status: 400 });
    }

    // 1. Invocar SDK oficial de Nave Banco Galicia
    const paymentIntent = await createNavePaymentIntent({
      externalPaymentId,
      amount: numAmount,
      currency: currency as 'ARS' | 'USD',
      productName,
      productDescription: productDescription || `Expediente ${externalPaymentId} - ${productName}`,
      buyer: buyer ? {
        name: buyer.name,
        email: buyer.email,
        docNumber: buyer.docNumber,
        phone: buyer.phone
      } : undefined,
      callbackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://travelapp-ecosystem.vercel.app'}/checkout/success?file=${externalPaymentId}`
    });

    // 2. Si se proporciona reservationId, actualizar el expediente en Firestore
    if (reservationId) {
      try {
        await serverUpdateDoc('experience_reservations', reservationId, {
          navePaymentRequestId: paymentIntent.id,
          naveCheckoutUrl: paymentIntent.checkout_url,
          naveQrData: paymentIntent.qr_data,
          paymentMethodUsed: 'NAVE (Banco Galicia)',
          updatedAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('[NAVE Intent API] No se pudo actualizar reservation en Firestore:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      paymentRequestId: paymentIntent.id,
      checkoutUrl: paymentIntent.checkout_url,
      qrData: paymentIntent.qr_data,
      externalPaymentId: paymentIntent.external_payment_id
    });
  } catch (error: any) {
    console.error('[NAVE Intent API Error]:', error);
    return NextResponse.json(
      { error: 'Error al generar la intención de pago en Nave', details: error.message },
      { status: 500 }
    );
  }
}
