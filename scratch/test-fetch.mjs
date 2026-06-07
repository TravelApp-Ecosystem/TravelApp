function parseFirestoreValue(value) {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return parseFloat(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('mapValue' in value) {
    return parseFirestoreFields(value.mapValue.fields || {});
  }
  if ('arrayValue' in value) {
    const values = value.arrayValue.values || [];
    return values.map((v) => parseFirestoreValue(v));
  }
  return null;
}

function parseFirestoreFields(fields) {
  const result = {};
  for (const key in fields) {
    result[key] = parseFirestoreValue(fields[key]);
  }
  return result;
}

async function checkDoc(docId) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/mvp-travelapp/databases/(default)/documents/cms/${docId}`;
    console.log(`\n--- Fetching doc: ${docId} ---`);
    const res = await fetch(url);
    console.log("Status:", res.status);
    const data = await res.json();
    if (data.fields) {
      const parsed = parseFirestoreFields(data.fields);
      console.log("PARSED SUCCESS!");
      if (parsed.hero) {
        console.log("Hero Title:", parsed.hero.title);
        console.log("Hero MediaUrl:", parsed.hero.mediaUrl);
      } else if (parsed.pasajeroHero) {
        console.log("PasajeroHero Title:", parsed.pasajeroHero.title);
        console.log("PasajeroHero BackgroundImage:", parsed.pasajeroHero.backgroundImage);
      } else if (parsed.heroSlides) {
        console.log("HeroSlides count:", parsed.heroSlides.length);
        console.log("Slide 0 bgImage:", parsed.heroSlides[0]?.bgImage);
      } else {
        console.log("Keys:", Object.keys(parsed));
      }
    } else {
      console.log("No fields found:", data);
    }
  } catch (e) {
    console.error("Error fetching:", e);
  }
}

async function run() {
  await checkDoc("landing_ecosistema");
  await checkDoc("landing_travelcab");
  await checkDoc("landing_experience");
}

run();
