async function testWebhook() {
  console.log('Sending test POST request to local ManyChat webhook...');
  try {
    const res = await fetch('http://localhost:3000/api/webhooks/manychat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'travelapp_webhook_2026'
      },
      body: JSON.stringify({
        subscriber_id: 'test_sub_999',
        first_name: 'Tester',
        last_name: 'Manychat',
        message: 'Hola Travis, cotizame un viaje de San Martin 100 a Belgrano 500 en categoria Premium',
        phone: '+5493815551234',
        email: 'tester@travelapp.ar',
        whatsapp_id: 'test_sub_999'
      })
    });
    
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testWebhook();
