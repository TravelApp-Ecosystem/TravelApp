import { NextRequest, NextResponse } from 'next/server';
import { serverAddDoc, serverGetDocs, serverUpdateDoc, serverGetDoc } from '@/lib/firestore-server';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const body = await req.json().catch(() => ({}));

    // Log raw incoming telemetry
    const timestamp = Date.now();
    await serverAddDoc('payment_webhooks_log', {
      provider: 'mercadopago',
      receivedAt: timestamp,
      queryParams: Object.fromEntries(searchParams.entries()),
      payload: body
    });

    const paymentId = body.data?.id || body.id || searchParams.get('data.id') || searchParams.get('id');
    const externalRef = body.external_reference || body.data?.external_reference || searchParams.get('external_reference');
    const status = body.status || body.data?.status || 'approved';
    const amount = Number(body.transaction_amount || body.data?.transaction_amount || 0);

    console.log(`[MP Webhook Real-time] PaymentID: ${paymentId}, File/Ref: ${externalRef}, Status: ${status}, Amount: $${amount}`);

    // If payment is approved, reconcile in Firestore
    if (status === 'approved' && externalRef) {
      // 1. Search matching reservation by File Number or ID
      const reservationsSnap = await serverGetDocs('experience_reservations', {
        where: [['fileNumber', '==', externalRef]]
      });

      if (!reservationsSnap.empty) {
        const resDoc = reservationsSnap.docs[0];
        const resData = resDoc.data();

        // Update reservation to Confirmada
        await serverUpdateDoc('experience_reservations', resDoc.id, {
          estado: 'Confirmada',
          paymentStatus: 'Aprobado (Mercado Pago)',
          mpPaymentId: paymentId || '',
          paidAt: timestamp
        });

        // 2. Inject cash movement into treasury
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
    provider: 'Mercado Pago Webhook Receptor',
    endpoint: '/api/webhooks/mercadopago'
  });
}
