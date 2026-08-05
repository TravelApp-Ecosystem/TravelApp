import { NextRequest, NextResponse } from 'next/server';

// GET /api/mercadopago/balance
// Consulta el saldo en tiempo real de la cuenta de Mercado Pago vinculada.
export async function GET(req: NextRequest) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken || accessToken.includes('TU_ACCESS_TOKEN')) {
      return NextResponse.json({
        success: true,
        isSimulated: true,
        balance: {
          total_amount: 0,
          available_balance: 0,
          unavailable_balance: 0,
          currency_id: 'ARS'
        },
        user: {
          nickname: 'TRAVELAPP_ECOSISTEMA',
          email: 'admin@travelapp.ar'
        },
        updatedAt: new Date().toISOString()
      });
    }

    // 1. Consultar saldo real de la cuenta en la API de Mercado Pago
    const balanceRes = await fetch('https://api.mercadopago.com/users/me/mercadopago_account/balance', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    let balanceData: any = null;
    if (balanceRes.ok) {
      balanceData = await balanceRes.json();
    } else {
      const errText = await balanceRes.text();
      console.warn('[MP Balance API Warning]:', errText);
    }

    // 2. Consultar perfil de la cuenta de Mercado Pago
    const userRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    let userData: any = null;
    if (userRes.ok) {
      userData = await userRes.json();
    }

    const totalAmount = balanceData?.total_amount ?? balanceData?.available_balance ?? 0;
    const availableBalance = balanceData?.available_balance ?? totalAmount;
    const unavailableBalance = balanceData?.unavailable_balance ?? 0;
    const currencyId = balanceData?.currency_id || 'ARS';

    return NextResponse.json({
      success: true,
      isReal: true,
      balance: {
        total_amount: Number(totalAmount),
        available_balance: Number(availableBalance),
        unavailable_balance: Number(unavailableBalance),
        currency_id: currencyId
      },
      user: {
        nickname: userData?.nickname || userData?.first_name || 'Mercado Pago Ecosistema',
        email: userData?.email || 'travelapp.ecosistema@mercadopago.com',
        collectorId: userData?.id || ''
      },
      updatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[MP Balance Error]:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al consultar saldo en Mercado Pago',
      detail: error.message
    }, { status: 500 });
  }
}
