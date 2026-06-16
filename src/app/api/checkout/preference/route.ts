import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST /api/checkout/preference
// Genera una preferencia de Checkout Pro en Mercado Pago aplicando Split de Pagos 1:1 (marketplace_fee).
export async function POST(req: NextRequest) {
  try {
    const { amount, description, passengerEmail, driverId, tripId } = await req.json();

    if (!amount) {
      return NextResponse.json({ error: 'Monto es requerido' }, { status: 400 });
    }

    // 1. Cargar el token general de TravelApp
    const accessToken = process.env.MP_ACCESS_TOKEN;

    // 2. Obtener tarifa activa para calcular comisión dinámica
    let commissionPct = 10;
    try {
      const tariffDoc = await getDoc(doc(db, 'tariffs', 'mu_active'));
      if (tariffDoc.exists()) {
        const tariffData = tariffDoc.data();
        if (tariffData.commissionRatePct !== undefined) {
          commissionPct = tariffData.commissionRatePct;
        } else if (tariffData.electronicPaymentFee !== undefined) {
          commissionPct = tariffData.electronicPaymentFee;
        }
      }
    } catch (err) {
      console.warn('[Create Preference] No se pudo obtener comisión del tarifario, usando fallback 10%:', err);
    }

    const marketplaceFee = Math.round(Number(amount) * (commissionPct / 100));

    console.log(`[Create Preference] Creando preferencia MP para viaje: ${tripId || 'landing'}. Total: $${amount}. Comisión Ecosistema: $${marketplaceFee}`);

    // 3. Llamada a la API de Preferencias de Mercado Pago
    const mpUrl = 'https://api.mercadopago.com/checkout/preferences';
    
    if (accessToken && !accessToken.includes('TU_ACCESS_TOKEN')) {
      try {
        const response = await fetch(mpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            items: [
              {
                id: tripId || 'landing-trip',
                title: description || 'Viaje TravelCab Especial',
                unit_price: Number(amount),
                quantity: 1,
                currency_id: 'ARS'
              }
            ],
            payer: {
              email: passengerEmail || 'test_user_wallet@travelapp.ar'
            },
            marketplace_fee: Number(marketplaceFee), // Descontar la comisión
            back_urls: {
              success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?tripId=${tripId || 'landing'}`,
              pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/pending`,
              failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/failure`
            },
            auto_return: 'approved',
            external_reference: tripId || 'landing-trip'
          })
        });

        if (response.ok) {
          const mpData = await response.json();
          return NextResponse.json({
            success: true,
            preferenceId: mpData.id,
            initPoint: mpData.init_point,
            sandboxInitPoint: mpData.sandbox_init_point
          });
        } else {
          const errBody = await response.text();
          console.warn('[Mercado Pago API error response]:', errBody);
        }
      } catch (err) {
        console.error('[Mercado Pago API error]:', err);
      }
    }

    // Fallback simulado si no hay token o la API falla
    const simulatedInitPoint = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/mp-simulated-pay?amount=${amount}&tripId=${tripId || 'landing'}`;
    return NextResponse.json({
      success: true,
      preferenceId: 'pref_sim_' + Date.now(),
      initPoint: simulatedInitPoint,
      sandboxInitPoint: simulatedInitPoint,
      isSimulated: true
    });

  } catch (error: any) {
    console.error('[Create Preference Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
