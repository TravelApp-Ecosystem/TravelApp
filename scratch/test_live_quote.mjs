async function testLiveQuote() {
  console.log('Sending quote request to production ManyChat webhook...');
  try {
    const res = await fetch('https://admin.travelapp.ar/api/webhooks/manychat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'travelapp_webhook_2026'
      },
      body: JSON.stringify({
        subscriber_id: 'test_sub_999_quote',
        first_name: 'TesterQuote',
        last_name: 'Manychat',
        message: '¿Cuánto sale ir desde Perú 1961 en Yerba Buena hasta Pje. Einstein 632 en San Miguel de Tucumán?',
        phone: '+5493815551234',
        email: 'tester@travelapp.ar',
        whatsapp_id: 'test_sub_999_quote'
      })
    });
    
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response JSON:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testLiveQuote();
