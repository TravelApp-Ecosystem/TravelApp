function parseFirestoreValue(value: any): any {
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
    return values.map((v: any) => parseFirestoreValue(v));
  }
  return null;
}

function parseFirestoreFields(fields: any): any {
  const result: any = {};
  for (const key in fields) {
    result[key] = parseFirestoreValue(fields[key]);
  }
  return result;
}

export async function fetchCmsData(documentId: string): Promise<any | null> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/mvp-travelapp/databases/(default)/documents/cms/${documentId}`;
    // Usamos fetch nativo con no-store para evitar almacenamiento en caché en el edge de Vercel
    // y asegurar que los cambios del CMS se reflejen de inmediato al refrescar.
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`Failed to fetch CMS doc ${documentId} via REST: status ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.fields) {
      return parseFirestoreFields(data.fields);
    }
  } catch (e) {
    console.error(`Error fetching CMS doc ${documentId} via REST:`, e);
  }
  return null;
}
