async function testProdWebhook() {
  console.log('Sending test POST request to production ManyChat webhook...');
  try {
    const res = await fetch('https://admin.travelapp.ar/api/webhooks/manychat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'travelapp_webhook_2026'
      },
      body: JSON.stringify({
        subscriber_id: 'test_sub_999',
        first_name: 'Tester',
        last_name: 'Manychat',
        message: 'Hola',
        phone: '+5493815551234',
        email: 'tester@travelapp.ar',
        whatsapp_id: 'test_sub_999'
      })
    });
    
    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response text:', text);
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testProdWebhook();
