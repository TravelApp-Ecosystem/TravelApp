// =============================================================================
// TRAVIS IA — Core Cognitive Engine & Omnichannel Coordinator
// POST /api/travis/chat
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDoc, getDocs, query, where, limit, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TravisConfig, DEFAULT_TRAVIS_CONFIG } from '@/types/messaging';

// -----------------------------------------------------------------------------
// HELPER: Load Configuration and Catalogs from Firestore
// -----------------------------------------------------------------------------
async function getTravisConfig(): Promise<TravisConfig> {
  try {
    const configDoc = await getDoc(doc(db, 'travisConfig', 'main'));
    if (configDoc.exists()) {
      return configDoc.data() as TravisConfig;
    }
  } catch { /* fallback */ }
  return { ...DEFAULT_TRAVIS_CONFIG, updatedAt: Date.now() };
}

async function getEcosystemCatalogs(): Promise<string> {
  let catalogContext = '';
  try {
    // 1. Experiences (Tours)
    const expSnap = await getDocs(query(collection(db, 'experiences')));
    if (!expSnap.empty) {
      catalogContext += '\n### CATÁLOGO DE EXPERIENCIAS (TOURS) ACTIVAS:\n';
      expSnap.docs.forEach(d => {
        const t = d.data();
        catalogContext += `- ${t.title} (ID: ${t.id}): Ubicación: ${t.location}, Precio: $${t.price} ${t.currency || 'ARS'}, Salida: ${t.departureDate || 'A convenir'}, Tipo: ${t.tripType}, Disponibilidad: ${t.availability || 'Disponible'}. Servicios: ${t.services?.join(', ') || 'Varios'}. Descripción: ${t.description || ''}\n`;
      });
    }

    // 2. Rewards (Loyalty items)
    const rewardsSnap = await getDocs(query(collection(db, 'reward_items')));
    if (!rewardsSnap.empty) {
      catalogContext += '\n### PROGRAMA DE PREMIOS Y BENEFICIOS REWARDS:\n';
      rewardsSnap.docs.forEach(d => {
        const r = d.data();
        catalogContext += `- ${r.title}: Requiere ${r.pointsRequired} puntos. Categoría: ${r.category}, Comercio/Socio: ${r.partner || 'TravelApp'}, Estado: ${r.availability || 'Disponible'}. Descripción: ${r.description || ''}\n`;
      });
    }
  } catch (err) {
    console.warn('[Travis RAG] Error loading catalogs:', err);
  }
  return catalogContext;
}

// -----------------------------------------------------------------------------
// HELPER: Google Maps API Distance & Travel Cab Pricing Calculator
// -----------------------------------------------------------------------------
async function estimateTravelCabFare(origin: string, destination: string): Promise<{
  cost: number;
  distanceKm: number;
  durationMin: number;
  status: string;
}> {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  // Fallback default
  let distanceKm = 8.5;
  let durationMin = 15;
  let status = 'mock_fallback';

  if (mapsKey && !mapsKey.includes('TU_')) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${mapsKey}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        distanceKm = Number((element.distance.value / 1000).toFixed(1));
        durationMin = Math.round(element.duration.value / 60);
        status = 'google_api';
      }
    } catch (err) {
      console.warn('[Travis Maps API] Routing failed, using fallback:', err);
    }
  }

  // Tarifa TravelCab Estándar Base (Cargada dinámicamente)
  let baseFare = 1200;
  let pricePerKm = 480;
  let travelMinutePrice = 120;
  let minimumFare = 2800;

  try {
    const activeTariffSnap = await getDoc(doc(db, 'tariffs', 'mu_active'));
    if (activeTariffSnap.exists()) {
      const t = activeTariffSnap.data();
      baseFare = t.baseFare || baseFare;
      pricePerKm = t.pricePerKm || pricePerKm;
      travelMinutePrice = t.travelMinutePrice || travelMinutePrice;
      minimumFare = t.minimumFare || minimumFare;
      status += '_with_db_tariffs';
    }
  } catch (err) {
    console.warn('[Travis Pricing] Error loading dynamic active tariffs, using default fallbacks:', err);
  }

  const calculated = baseFare + (pricePerKm * distanceKm) + (travelMinutePrice * durationMin);
  const cost = Math.max(minimumFare, Math.round(calculated));

  return { cost, distanceKm, durationMin, status };
}

// -----------------------------------------------------------------------------
// Reusable Core AI Processor
// -----------------------------------------------------------------------------
export async function processTravisMessage(message: string, history: any[], businessUnit: string, conversationId?: string) {
  // 1. Cargar Configuración base e incorporar Catálogos de Experiencias y Rewards
  const config = await getTravisConfig();
  const catalogs = await getEcosystemCatalogs();
  
  // Calcular disponibilidad de despacho por horarios de Argentina
  const now = new Date();
  const argTime = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Tucuman',
    hour: 'numeric',
    hour12: false
  }).format(now);
  const currentHour = parseInt(argTime, 10);
  
  // Despacho IA permitido de 22:00 a 08:00 o si está forzado manualmente
  const isOutOfHours = currentHour >= 22 || currentHour < 8;
  const isDispatchAllowed = isOutOfHours || !!config.isAiDispatchForcedEnabled;
  
  // Unir system prompt base + contexto de negocio
  let systemPrompt = config.systemPrompt;
  systemPrompt += `\n\nCONTEXTO GENERAL DEL NEGOCIO:\n${config.businessContext}`;
  
  // Instrucciones cognitivas ocultas para habilitar Cotizador, Captura de Leads y Handoff
  systemPrompt += `
\nINSTRUCCIONES CRÍTICAS DE SISTEMA (OCULTAS AL USUARIO):
1. **Cotización de Viajes (TravelCab)**: Si el usuario te pide cotizar o saber el precio de un traslado de TravelCab entre dos puntos, responde normalmente PERO incluye obligatoriamente en tu respuesta la siguiente etiqueta exacta: [QUOTE: ORIGEN TO DESTINO] reemplazando ORIGEN y DESTINO por las direcciones indicadas. Ejemplo: [QUOTE: Yerba Buena TO Plaza Independencia]. El sistema calculará el precio exacto y reemplazará esta etiqueta.
   * REGLA DE CAPTURA: Para poder cotizar, es obligatorio contar con: Nombre, Teléfono, Origen, Destino y Forma de Pago (Efectivo, Billetera Virtual o Puntos Rewards). Si falta alguno de estos datos, pídelo educadamente y NO generes la cotización hasta tenerlos todos.
2. **Despacho de Viajes**: Si el cliente confirma de manera explícita que desea reservar/pedir el traslado cotizado (ej: "sí, pedilo", "confirmar traslado"), responde de manera entusiasta e incluye la etiqueta invisible: [DISPATCH: TIPO_SERVICIO | ORIGEN TO DESTINO | PASAJERO | TELEFONO | ASIENTOS | PAGO] usando los datos capturados.
   * TIPO_SERVICIO: Debe ser "MU" (Movilidad Urbana) o "ARC" (Auto Rural Compartido) según lo que solicite el usuario.
   * ASIENTOS: Cantidad de asientos solicitados (ej: 1, 2, 3, 4). Default 1.
   * PAGO: "Efectivo", "Billetera Virtual" o "Puntos Rewards".
   * REGLA DE DISPOSITIVO MÓVIL: Si el usuario te escribe por WhatsApp desde un celular (o si te pide pedir un viaje desde su celular), indícale amablemente que debe utilizar la aplicación móvil de TravelApp. Bajo ningún concepto le cotices o asignes el viaje por chat en este caso. En su lugar, genera la etiqueta: [REDIRECT: APP_MOVIL].
   * REGLA DE HORARIO OPERATIVO: Actualmente la hora en Tucumán es: ${currentHour}:00 hs. ¿El despacho por IA está habilitado?: ${isDispatchAllowed ? 'SÍ' : 'NO'}. Si está deshabilitado ("NO"), debes explicar amablemente al cliente que en este horario (de 08:00 a 22:00) la asignación la realiza el despachador humano de nuestras sucursales y que aguarde o se contacte allí. NO generes la etiqueta [DISPATCH: ...] bajo ningún concepto si el despacho por IA está deshabilitado.
3. **Captura de Leads y Datos**: Si el cliente te menciona datos personales suyos (nombre, teléfono, email) o si te solicita cotizar/comprar y ya cuentas con estos datos, debes añadir al final de tu respuesta de forma invisible el siguiente bloque: [DATA: {"name": "...", "phone": "...", "email": "...", "handoff": true/false}].
4. **Escalamiento Humano (Handoff)**: Si el cliente solicita pagar, cerrar un trato, realizar el cobro, o tiene un problema/pregunta que requiere atención personalizada, o menciona palabras de handoff (como "hablar con operador"), pon "handoff": true en el bloque [DATA: ...] y despide amigablemente aclarando que un operador humano continuará la charla.
5. **Ventas y Cobros de Tours (Experiences)**: Puedes cotizar y recomendar tours usando la base de conocimiento o buscando información en línea (recomendar operadores asociados, sugerir hoteles). Para viajes organizados por nosotros, indica que puedes reservar cupos a través de Nave (Banco Galicia) y ofrecer planes de financiación. Si cotizas un viaje turístico de Experiences, genera al final de tu respuesta el tag invisible: [PDF_GENERATE: Experiencia | Detalles del Tour] para armarle un PDF.
6. **Localización de Lenguaje**: Debes responder de forma cálida, en español rioplatense argentino (usando el "vos", "tenés", "comentame"). Si el cliente inicia la conversación en otro idioma (inglés, portugués, etc.), respóndele en ese mismo idioma.
`;

  // 2. Comprobar si hay handoff triggers de texto plano configurados
  const needsHandoffDirect = config.handoffTriggers.some(trigger =>
    message.toLowerCase().includes(trigger.toLowerCase())
  );

  if (needsHandoffDirect && conversationId) {
    // Registrar handoff en la conversación
    await updateDoc(doc(db, 'conversations', conversationId), {
      status: 'pending',
      lastMessage: 'Handoff escalado por trigger de texto',
      lastMessageAt: Date.now()
    });
    return {
      response: 'Entendido, che. En este momento te conecto con un miembro de nuestro equipo para que te asista de forma personalizada. Por favor, aguardá un instante. 🙏',
      needsHandoff: true,
      businessUnit,
      source: 'local_handoff'
    };
  }

  // 3. Llamar a la API REST de Gemini directamente
  let geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  // Si no está en el .env, advertimos por consola
  if (!geminiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables.");
  }
  
  let aiResponse = '';
  let isMock = true;

  const knowledgeBaseSerialized = (config.knowledgeBase?.map(k => `## [Artículo: ${k.category}] ${k.title}\n${k.content}`).join('\n\n') || '') + '\n' + catalogs;

  if (geminiKey && !geminiKey.includes('TU_')) {
    try {
      const contents = [];
      // Agregar historial
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          const role = h.role === 'assistant' || h.role === 'travis' || h.role === 'model' ? 'model' : 'user';
          contents.push({
            role,
            parts: [{ text: h.content || h.message || '' }]
          });
        });
      }
      // Agregar mensaje actual
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const fullPrompt = `${systemPrompt}\n\nBASE DE CONOCIMIENTOS DE LA EMPRESA (RAG):\n${knowledgeBaseSerialized}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: fullPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (aiResponse) isMock = false;
      } else {
        const errText = await response.text();
        console.warn('[Travis Gemini REST] API call failed:', errText);
      }
    } catch (err) {
      console.warn('[Travis Gemini REST] Fetch failed, fallback to mock:', err);
    }
  }

  // Fallback Mock local si la API de Gemini no responde o no está configurada la Key
  if (isMock) {
    if (message.toLowerCase().includes('cotiz') || message.toLowerCase().includes('cuanto sale') || message.toLowerCase().includes('precio de')) {
      aiResponse = `Por supuesto, puedo darte un estimado. [QUOTE: Yerba Buena TO Plaza Independencia tucuman]. Si deseas confirmarlo, facilitame tu Nombre y Teléfono.`;
    } else if (message.toLowerCase().includes('tour') || message.toLowerCase().includes('mendoza')) {
      aiResponse = `¡Excelente elección! Mendoza Wine Tour Premium (USD 350) incluye visitas guiadas a bodegas boutique del Valle de Uco con almuerzo maridado. ¿Querés que agende tus datos para reservar? [PDF_GENERATE: Experiencia | Mendoza Tour Premium]`;
    } else {
      aiResponse = `¡Hola! Soy Travis, tu asistente virtual de TravelApp. Puedo cotizarte viajes en TravelCab, coordinar excursiones en Experiencias o consultar tus puntos de Rewards. ¿En qué te puedo ayudar hoy?`;
    }
  }

  // 4. Interceptar y procesar etiqueta [QUOTE: ORIGIN TO DESTINATION]
  const quoteRegex = /\[QUOTE:\s*([^\]]+?)\s*TO\s*([^\]]+?)\]/i;
  const quoteMatch = aiResponse.match(quoteRegex);
  if (quoteMatch) {
    const origin = quoteMatch[1].trim();
    const destination = quoteMatch[2].trim();
    
    // Calcular cotización real con API de Google Maps o mock de respaldo
    const estimation = await estimateTravelCabFare(origin, destination);
    
    const pricingText = `\n\n📌 **COTIZACIÓN ESTIMADA DE TRASLADO (TravelCab):**\n` +
                        `• **Desde:** ${origin}\n` +
                        `• **Hasta:** ${destination}\n` +
                        `• **Distancia aprox:** ${estimation.distanceKm} km (${estimation.durationMin} mins)\n` +
                        `• **Tarifa Estimada:** $${estimation.cost.toLocaleString('es-AR')} ARS (Pago Efectivo/Billetera virtual)\n` +
                        `*(El costo final puede variar por tráfico o paradas intermedias)*`;
    
    aiResponse = aiResponse.replace(quoteRegex, pricingText);

    // Trigger Zapier Webhook para Nueva Cotización en segundo plano
    if (process.env.ZAPIER_WEBHOOK_NEW_BOOKING) {
      fetch(process.env.ZAPIER_WEBHOOK_NEW_BOOKING, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          distanceKm: estimation.distanceKm,
          cost: estimation.cost,
          conversationId,
          timestamp: Date.now()
        })
      }).catch(() => {});
    }
  }

  // 4.5. Interceptar y procesar etiqueta [DISPATCH: TIPO_SERVICIO | ORIGEN TO DESTINO | PASAJERO | TELEFONO | ASIENTOS | PAGO]
  const dispatchRegex = /\[DISPATCH:\s*([^\]]+?)\]/i;
  const dispatchMatch = aiResponse.match(dispatchRegex);
  if (dispatchMatch) {
    const rawParams = dispatchMatch[1].split('|').map((s: string) => s.trim());
    if (rawParams.length >= 4) {
      const serviceType = rawParams[0].toUpperCase() === 'ARC' ? 'ARC' : 'MU';
      const routeParts = rawParams[1].split(/\s+TO\s+/i);
      const origin = routeParts[0] ? routeParts[0].trim() : 'Origen no especificado';
      const destination = routeParts[1] ? routeParts[1].trim() : 'Destino no especificado';
      const passengerName = rawParams[2] || 'Pasajero Chat';
      const passengerPhone = rawParams[3] || 'No provisto';
      const seats = rawParams[4] ? parseInt(rawParams[4], 10) || 1 : 1;
      const paymentMethod = rawParams[5] || 'Efectivo';

      try {
        const estimation = await estimateTravelCabFare(origin, destination);
        let finalPrice = estimation.cost;
        if (serviceType === 'ARC') {
          finalPrice = estimation.cost * seats;
        }
        
        const tripRef = await addDoc(collection(db, 'trips'), {
          passengerName,
          passengerPhone,
          origin,
          destination,
          status: 'Buscando Chofer',
          price: finalPrice,
          distanceKm: estimation.distanceKm,
          durationMinutes: estimation.durationMin,
          serviceType,
          seats,
          paymentMethod,
          paymentStatus: paymentMethod === 'Efectivo' ? 'pending' : 'awaiting_payment',
          category: 'estandar',
          createdAt: Date.now(),
          source: 'travis_ai_dispatch'
        });

        const serviceLabel = serviceType === 'ARC' ? 'Auto Rural Compartido (ARC)' : 'Movilidad Urbana (MU)';
        const seatLabel = serviceType === 'ARC' ? `\n• **Asientos Reservados:** ${seats}` : '';
        const paymentLabel = paymentMethod === 'Efectivo' 
          ? 'Efectivo (Pago al conductor)' 
          : paymentMethod === 'Puntos Rewards' 
            ? 'Puntos Rewards' 
            : 'Billetera Virtual';

        const confirmationText = `\n\n🚕 **TRASLADO PROGRAMADO Y DESPACHADO:**\n` +
                                 `• **Código de Viaje:** ${tripRef.id}\n` +
                                 `• **Servicio:** ${serviceLabel}${seatLabel}\n` +
                                 `• **Origen:** ${origin}\n` +
                                 `• **Destino:** ${destination}\n` +
                                 `• **Forma de Pago:** ${paymentLabel}\n` +
                                 `• **Tarifa Total Estimada:** $${finalPrice.toLocaleString('es-AR')} ARS\n` +
                                 `Estamos buscando tu conductor. Te notificaremos al instante en que acepte el viaje. 🙌`;

        aiResponse = aiResponse.replace(dispatchRegex, confirmationText);
      } catch (dispatchErr) {
        console.error('[Travis Dispatch] Error creating trip from chat:', dispatchErr);
        aiResponse = aiResponse.replace(dispatchRegex, '\n*(Error interno al procesar el despacho del viaje)*');
      }
    }
  }

  // Interceptar redirección de aplicación móvil
  const redirectRegex = /\[REDIRECT:\s*APP_MOVIL\s*\]/i;
  if (redirectRegex.test(aiResponse)) {
    aiResponse = aiResponse.replace(redirectRegex, '') + 
                 `\n\n📲 **Descargá la App:** Para pedir o cotizar un viaje desde tu celular, por favor descargá nuestra aplicación móvil oficial desde aquí: [App Store / Google Play](https://travelapp.com/download)`;
  }

  // Interceptar generación de PDFs de Experience
  const pdfRegex = /\[PDF_GENERATE:\s*([^\]|]+?)\s*\|\s*([^\]]+?)\]/i;
  const pdfMatch = aiResponse.match(pdfRegex);
  if (pdfMatch) {
    const tourName = pdfMatch[1].trim();
    const tourDetails = pdfMatch[2].trim();
    const pdfUrl = `/api/experiences/download-pdf?tour=${encodeURIComponent(tourName)}`;
    const pdfText = `\n\n📄 **PROPUESTA EN PDF GENERADA:**\n` +
                    `• **Tour:** ${tourName}\n` +
                    `• Podés descargar tu itinerario y propuesta en PDF haciendo clic aquí: [Descargar Propuesta PDF](${pdfUrl})`;
    aiResponse = aiResponse.replace(pdfRegex, pdfText);
  }

  // 5. Interceptar y procesar etiqueta [DATA: JSON_BLOCK]
  const dataRegex = /\[DATA:\s*(\{.+?\})\s*\]/;
  const dataMatch = aiResponse.match(dataRegex);
  let parsedData: { name?: string; phone?: string; email?: string; handoff?: boolean } = {};

  if (dataMatch) {
    try {
      parsedData = JSON.parse(dataMatch[1]);
      aiResponse = aiResponse.replace(dataRegex, ''); // Quitar etiqueta invisible de la respuesta final
    } catch (err) {
      console.error('[Travis Engine] Error parsing captured JSON data:', err);
    }
  }

  // Sincronizar con el CRM Leads de Firestore si hay datos o si forzamos Handoff
  const hasLeadData = parsedData.name || parsedData.phone || parsedData.email;
  const executionHandoff = parsedData.handoff || needsHandoffDirect;

  if (hasLeadData || executionHandoff) {
    try {
      const leadsRef = collection(db, 'leads');
      let leadId = null;

      const leadPayload = {
        customerName: parsedData.name || 'Prospecto Omnicanal',
        phone: parsedData.phone || '',
        email: parsedData.email || '',
        origin: businessUnit,
        status: executionHandoff ? 'En Espera Operador' : 'Nuevos',
        customerStatus: 'Prospecto',
        customerLevel: 1,
        businessUnit: businessUnit === 'General' ? 'General' : businessUnit,
        lastInteraction: Date.now(),
        conversationId: conversationId || ''
      };

      // Buscar duplicados por teléfono
      if (parsedData.phone) {
        const q = query(leadsRef, where('phone', '==', parsedData.phone), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          leadId = snap.docs[0].id;
          await updateDoc(doc(db, 'leads', leadId), { ...leadPayload, updatedAt: Date.now() });
        }
      }

      // Si no existe, crear uno nuevo
      if (!leadId) {
        const newDoc = await addDoc(leadsRef, {
          ...leadPayload,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        leadId = newDoc.id;
      }

      // Trigger Zapier Webhook para Lead capturado en segundo plano
      if (process.env.ZAPIER_WEBHOOK_NEW_LEAD) {
        fetch(process.env.ZAPIER_WEBHOOK_NEW_LEAD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, ...leadPayload })
        }).catch(() => {});
      }

      // Si es handoff, actualizar estado de la conversación en Firestore
      if (executionHandoff && conversationId) {
        await updateDoc(doc(db, 'conversations', conversationId), {
          status: 'pending',
          lastMessage: 'Handoff activado por IA',
          lastMessageAt: Date.now()
        });
      }
    } catch (crmErr) {
      console.error('[Travis CRM Sync] Error syncing lead:', crmErr);
    }
  }

  return {
    response: aiResponse.trim(),
    businessUnit,
    source: isMock ? 'mock_fallback' : 'vertex_ai',
    needsHandoff: executionHandoff,
  };
}

// -----------------------------------------------------------------------------
// POST Handler
// -----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      message, 
      conversationId, 
      businessUnit = 'General',
      history = []
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await processTravisMessage(message, history, businessUnit, conversationId);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Travis Chat API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
