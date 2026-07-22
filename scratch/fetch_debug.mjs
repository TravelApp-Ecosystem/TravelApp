async function fetchDebug() {
  const url = `https://admin.travelapp.ar/api/test-debug?t=${Date.now()}`;
  console.log('Fetching production endpoint with cache buster:', url);
  try {
    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

fetchDebug();
