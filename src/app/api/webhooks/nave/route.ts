import { NextRequest, NextResponse } from 'next/server';
import { serverAddDoc, serverGetDocs, serverUpdateDoc } from '@/lib/firestore-server';

import { checkNavePaymentStatus } from '@/lib/nave-client';

const NAVE_STORE_CODE = process.env.NAVE_STORE_CODE || 'S-6A60-0761-P';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const body = await req.json().catch(() => ({}));

    const timestamp = Date.now();

    // Log raw incoming telemetry for Nave
    await serverAddDoc('payment_webhooks_log', {
      provider: 'nave_galicia',
      storeCode: NAVE_STORE_CODE,
      receivedAt: timestamp,
      queryParams: Object.fromEntries(searchParams.entries()),
      payload: body
    });

    let transactionId = body.payment_id || body.transaction_id || body.id || searchParams.get('id');
    let externalRef = body.external_payment_id || body.external_reference || body.merchant_order_id || searchParams.get('file_number');
    let status = (body.status || body.state || 'APPROVED').toUpperCase();
    let amount = Number(body.amount || body.total_amount || 0);

    // If payment_check_url is provided, query Nave payment check API per official specification
    if (body.payment_check_url) {
      const liveCheck = await checkNavePaymentStatus(body.payment_check_url);
      if (liveCheck) {
        status = (liveCheck.status?.name || status).toUpperCase();
        externalRef = liveCheck.external_payment_id || externalRef;
        amount = Number(liveCheck.available_balance?.value || liveCheck.transactions?.[0]?.amount?.value || amount);
      }
    }

    console.log(`[NAVE Galicia Webhook] TxID: ${transactionId}, File/Ref: ${externalRef}, Status: ${status}, Amount: $${amount}`);

    // If transaction is approved, reconcile in Firestore
    if ((status === 'APPROVED' || status === 'APROBADO' || status === 'COMPLETED') && externalRef) {
      // 1. Search matching reservation
      const reservationsSnap = await serverGetDocs('experience_reservations', {
        where: [['fileNumber', '==', externalRef]]
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
