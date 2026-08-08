import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPartnerTier, DEFAULT_EXPERIENCE_TIERS } from '@/lib/commissions';

// POST /api/checkout/experience-preference
// Genera una preferencia de Checkout Pro en Mercado Pago aplicando Split Inverso (Embajador vs Empresa).
// El Embajador recibe su comisión (% según su nivel) y la plataforma TravelApp retiene el NETO mayoritario como application_fee.
export async function POST(req: NextRequest) {
  try {
    const { amount, experienceTitle, partnerId, customerEmail, bookingId } = await req.json();

    if (!amount || !partnerId) {
      return NextResponse.json({ error: 'Monto y Partner ID son requeridos' }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;

    // 1. Obtener datos del embajador para calcular comisión según su nivel
    let ambassadorCommissionPct = 5; // Fallback al 5% (Pro Creator)

    try {
      const partnerDoc = await getDoc(doc(db, 'partners', partnerId));
      if (partnerDoc.exists()) {
        const partnerData = partnerDoc.data();
        const totalBookings = partnerData.totalBookingsConcreted || 0;
        const currentTier = getPartnerTier(totalBookings, DEFAULT_EXPERIENCE_TIERS);
        ambassadorCommissionPct = currentTier.commissionPct;
      }
    } catch (err) {
      console.warn('[Experience Preference] No se pudo obtener nivel del partner, usando fallback 5%:', err);
    }

    // 2. Calcular montos (SPLIT INVERSO)
    // Ejemplo: Monto Paquete = $100.000, Comisión Embajador (10%) = $10.000.
    // La empresa retiene como application_fee (neto mayoritario) = $90.000 (90%).
    const ambassadorCommissionAmount = Math.round(Number(amount) * (ambassadorCommissionPct / 100));
    const companyNetFee = Number(amount) - ambassadorCommissionAmount; // Neto para TravelApp

    console.log(`[Experience Preference] Cobro Paquete: ${experienceTitle || 'Experiencia'}. Total: $${amount}. Comisión Embajador (${ambassadorCommissionPct}%): $${ambassadorCommissionAmount}. Neto Empresa: $${companyNetFee}`);

    // 3. Crear Preferencia en Mercado Pago
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
                id: bookingId || 'exp-booking',
                title: experienceTitle || 'Reserva TravelApp Experience',
                unit_price: Number(amount),
                quantity: 1,
                currency_id: 'ARS'
              }
            ],
            payer: {
              email: customerEmail || 'cliente@travelapp.ar'
            },
            marketplace_fee: Number(companyNetFee), // Split inverso: La empresa retiene el neto mayoritario
            back_urls: {
              success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/experiences/success?bookingId=${bookingId || 'exp'}`,
              pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/experiences/pending`,
              failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/experiences/failure`
            },
            auto_return: 'approved',
            external_reference: bookingId || 'exp-booking'
          })
        });

        if (response.ok) {
          const mpData = await response.json();
          return NextResponse.json({
            success: true,
            preferenceId: mpData.id,
            initPoint: mpData.init_point,
            sandboxInitPoint: mpData.sandbox_init_point,
            ambassadorCommissionAmount,
            companyNetFee
          });
        }
      } catch (err) {
        console.error('[Experience MP Preference Error]:', err);
      }
    }

    // Fallback simulado para entorno de desarrollo
    const simulatedInitPoint = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/experiences/mp-simulated-pay?amount=${amount}&bookingId=${bookingId || 'exp'}`;
    return NextResponse.json({
      success: true,
      preferenceId: 'pref_exp_sim_' + Date.now(),
      initPoint: simulatedInitPoint,
      sandboxInitPoint: simulatedInitPoint,
      ambassadorCommissionAmount,
      companyNetFee,
      isSimulated: true
    });

  } catch (error: any) {
    console.error('[Experience Preference Exception]:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
