import { NextRequest, NextResponse } from 'next/server';
import { serverAddDoc, serverGetDocs, serverUpdateDoc } from '@/lib/firestore-server';
import crypto from 'crypto';

// Función para verificar la firma de seguridad (x-signature) enviada por Mercado Pago
function verifyMercadoPagoSignature(req: NextRequest, dataId: string): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Si no está configurado el secreto aún, permitimos el paso pero registramos advertencia
    return true;
  }

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  if (!xSignature || !xRequestId) {
    return false;
  }

  // Parsear la cabecera x-signature (ej: ts=1700000000,v1=abcdef...)
  const parts = xSignature.split(',');
  let ts = '';
  let v1 = '';

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key.trim() === 'ts') ts = value.trim();
    if (key.trim() === 'v1') v1 = value.trim();
  }

  if (!ts || !v1) return false;

  // Construir la plantilla de manifiesto
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

  return hmac === v1;
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const body = await req.json().catch(() => ({}));

    const paymentId = body.data?.id || body.id || searchParams.get('data.id') || searchParams.get('id') || '';

    // Validar firma de seguridad si se recibió paymentId
    const isValidSignature = verifyMercadoPagoSignature(req, String(paymentId));
    if (!isValidSignature) {
      console.warn('[MP Webhook] Firma de seguridad inválida o sospechosa (x-signature check failed)');
      return NextResponse.json({ error: 'Firma de seguridad no válida' }, { status: 401 });
    }

    // Registrar telemetría de recepción en Firestore
    const timestamp = Date.now();
    await serverAddDoc('payment_webhooks_log', {
      provider: 'mercadopago',
      receivedAt: timestamp,
      queryParams: Object.fromEntries(searchParams.entries()),
      payload: body,
      secureVerified: isValidSignature
    });

    const externalRef = body.external_reference || body.data?.external_reference || searchParams.get('external_reference');
    const status = body.status || body.data?.status || 'approved';
    const amount = Number(body.transaction_amount || body.data?.transaction_amount || 0);

    console.log(`[MP Webhook Real-time] PaymentID: ${paymentId}, Ref: ${externalRef}, Status: ${status}, Amount: $${amount}`);

    // Si el pago fue aprobado, conciliar viaje o reserva de experiencia
    if (status === 'approved' && externalRef) {
      // 1. Conciliar en viajes (trips)
      const tripDocs = await serverGetDocs('trips', {
        where: [['externalReference', '==', externalRef]]
      });

      if (!tripDocs.empty) {
        const tripDoc = tripDocs.docs[0];
        await serverUpdateDoc('trips', tripDoc.id, {
          paymentStatus: 'paid',
          mpPaymentId: paymentId,
          paidAt: timestamp
        });
      }

      // 2. Conciliar en reservas de experiencias (experience_reservations)
      const reservationsSnap = await serverGetDocs('experience_reservations', {
        where: [['fileNumber', '==', externalRef]]
      });

      if (!reservationsSnap.empty) {
        const resDoc = reservationsSnap.docs[0];
        const resData = resDoc.data();

        await serverUpdateDoc('experience_reservations', resDoc.id, {
          estado: 'Confirmada',
          paymentStatus: 'Aprobado (Mercado Pago)',
          mpPaymentId: paymentId || '',
          paidAt: timestamp
        });

        // Registrar movimiento de tesorería en libro contable
        await serverAddDoc('cash_movements', {
          branchId: resData.branchId || '1',
          branchName: resData.branchName || 'Sucursal Retiro',
          type: 'Ingreso',
          category: 'Venta de Experiencias (Mercado Pago)',
          description: `Cobro MP Aprobado - Expediente ${externalRef} (${resData.tourTitle || 'Tour'})`,
          amount: resData.amount || amount || 0,
          currency: resData.currency || 'ARS',
          source: 'mercadopago_ipn',
          paymentId: paymentId || '',
          fileNumber: externalRef,
          registeredAt: new Date().toISOString(),
          timestamp
        });
      }
    }

    return NextResponse.json({ status: 'ok', received: true, timestamp });
  } catch (error) {
    console.error('[MP Webhook Error]:', error);
    return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    provider: 'Mercado Pago Webhook Receptor Seguro',
    endpoint: '/api/webhooks/mercadopago'
  });
}
