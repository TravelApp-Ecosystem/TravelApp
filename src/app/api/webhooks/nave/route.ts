import { NextRequest, NextResponse } from 'next/server';
import { serverAddDoc, serverGetDocs, serverUpdateDoc } from '@/lib/firestore-server';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const body = await req.json().catch(() => ({}));

    const timestamp = Date.now();

    // Log raw incoming telemetry for Nave
    await serverAddDoc('payment_webhooks_log', {
      provider: 'nave_galicia',
      receivedAt: timestamp,
      queryParams: Object.fromEntries(searchParams.entries()),
      payload: body
    });

    const transactionId = body.transaction_id || body.id || body.payment_id || searchParams.get('id');
    const externalRef = body.external_reference || body.merchant_order_id || body.reference_id || searchParams.get('file_number');
    const status = (body.status || body.state || 'APPROVED').toUpperCase();
    const amount = Number(body.amount || body.total_amount || 0);

    console.log(`[NAVE Galicia Webhook] TxID: ${transactionId}, File/Ref: ${externalRef}, Status: ${status}, Amount: $${amount}`);

    // If transaction is approved, reconcile in Firestore
    if ((status === 'APPROVED' || status === 'APROBADO' || status === 'COMPLETED') && externalRef) {
      // 1. Search matching reservation
      const reservationsSnap = await serverGetDocs('experience_reservations', {
        where: [{ field: 'fileNumber', operator: '==', value: externalRef }]
      });

      if (!reservationsSnap.empty) {
        const resDoc = reservationsSnap.docs[0];
        const resData = resDoc.data();

        // Update reservation
        await serverUpdateDoc('experience_reservations', resDoc.id, {
          estado: 'Confirmada',
          paymentStatus: 'Aprobado (NAVE Banco Galicia)',
          naveTransactionId: transactionId || '',
          paidAt: timestamp
        });

        // 2. Inject cash movement
        await serverAddDoc('cash_movements', {
          branchId: resData.branchId || '1',
          branchName: resData.branchName || 'Sucursal Retiro',
          type: 'Ingreso',
          category: 'Venta de Experiencias (NAVE Galicia)',
          description: `Cobro NAVE Galicia Aprobado - Expediente ${externalRef} (${resData.tourTitle || 'Tour'})`,
          amount: resData.amount || amount || 0,
          currency: resData.currency || 'ARS',
          source: 'nave_galicia_webhook',
          transactionId: transactionId || '',
          fileNumber: externalRef,
          registeredAt: new Date().toISOString(),
          timestamp
        });
      }
    }

    return NextResponse.json({ status: 'success', received: true, timestamp });
  } catch (error) {
    console.error('[NAVE Webhook Error]:', error);
    return NextResponse.json({ error: 'NAVE Webhook Processing Failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    provider: 'NAVE (Banco Galicia) Webhook Receptor',
    endpoint: '/api/webhooks/nave'
  });
}
