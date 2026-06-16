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
  
  // Unir system prompt base + contexto de negocio
  let systemPrompt = config.systemPrompt;
  systemPrompt += `\n\nCONTEXTO GENERAL DEL NEGOCIO:\n${config.businessContext}`;
  
  // Instrucciones cognitivas ocultas para habilitar Cotizador, Captura de Leads y Handoff
  systemPrompt += `
\nINSTRUCCIONES CRÍTICAS DE SISTEMA (OCULTAS AL USUARIO):
1. **Cotización de Viajes**: Si el usuario te pide cotizar o saber el precio de un traslado de TravelCab entre dos puntos, responde normalmente PERO incluye obligatoriamente en tu respuesta la siguiente etiqueta exacta: [QUOTE: ORIGEN TO DESTINO] reemplazando ORIGEN y DESTINO por las direcciones indicadas. Ejemplo: [QUOTE: Yerba Buena TO Plaza Independencia]. El sistema calculará el precio exacto y reemplazará esta etiqueta.
2. **Captura de Leads y Datos**: Si el cliente te menciona datos personales suyos (nombre, teléfono, email) o si te solicita cotizar/comprar y ya cuentas con estos datos, debes añadir al final de tu respuesta de forma invisible el siguiente bloque: [DATA: {"name": "...", "phone": "...", "email": "...", "handoff": true/false}].
3. **Escalamiento Humano (Handoff)**: Si el cliente solicita pagar, cerrar un trato, realizar el cobro, o tiene un problema/pregunta que requiere atención personalizada, o menciona palabras de handoff (como "hablar con operador"), pon "handoff": true en el bloque [DATA: ...] y despide amigablemente aclarando que un operador humano continuará la charla.
4. **Ventas y Cobros**: Recuerda que NO debes procesar cobros ni vender directamente de forma autónoma. El cierre siempre debe ser asistido por humanos.
5. **Despacho de Viajes**: Si el cliente confirma de manera explícita que desea reservar/pedir el traslado cotizado (ej: "sí, pedilo", "confirmar traslado", "solicitar viaje"), responde de manera entusiasta e incluye la etiqueta invisible: [DISPATCH: ORIGEN TO DESTINO | PASAJERO | TELEFONO] usando los datos capturados. Ejemplo: [DISPATCH: Yerba Buena TO Plaza Independencia | Juan Pérez | +549381555666].
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
      response: 'Entendido. En este momento te conecto con un miembro de nuestro equipo que podrá ayudarte mejor con el cierre. Por favor, aguardá un instante. 🙏',
      needsHandoff: true,
      businessUnit,
      source: 'local_handoff'
    };
  }

  // 3. Llamar al Cloud Function de Travis (Vertex AI) pasando la base de conocimientos unificada
  const travisUrl = process.env.TRAVIS_WEBHOOK_URL;
  let aiResponse = '';
  let isMock = true;

  const knowledgeBaseSerialized = (config.knowledgeBase?.map(k => `## [Articulo: ${k.category}] ${k.title}\n${k.content}`).join('\n\n') || '') + '\n' + catalogs;

  if (travisUrl && !travisUrl.includes('TU_')) {
    try {
      const response = await fetch(travisUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.TRAVIS_WEBHOOK_SECRET ? { 'x-webhook-secret': process.env.TRAVIS_WEBHOOK_SECRET } : {}),
        },
        body: JSON.stringify({
          message,
          history,
          businessUnit,
          systemPrompt,
          knowledgeBase: knowledgeBaseSerialized,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.response || data.message || data.reply || data.text || '';
        if (aiResponse) isMock = false;
      }
    } catch (err) {
      console.warn('[Travis API] Vertex AI Cloud Function call failed, fallback to local NLP:', err);
    }
  }

  // Fallback Mock local si la Cloud Function no está disponible
  if (isMock) {
    if (message.toLowerCase().includes('cotiz') || message.toLowerCase().includes('cuanto sale') || message.toLowerCase().includes('precio de')) {
      aiResponse = `Por supuesto, puedo darte un estimado. [QUOTE: Yerba Buena TO Plaza Independencia tucuman]. Si deseas confirmarlo, facilítame tu Nombre y Teléfono.`;
    } else if (message.toLowerCase().includes('tour') || message.toLowerCase().includes('mendoza')) {
      aiResponse = `¡Excelente elección! Mendoza Wine Tour Premium (USD 350) incluye visitas guiadas a bodegas boutique del Valle de Uco con almuerzo maridado. ¿Querés que agende tus datos para reservar?`;
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

  // 4.5. Interceptar y procesar etiqueta [DISPATCH: ORIGEN TO DESTINO | PASAJERO | TELEFONO]
  const dispatchRegex = /\[DISPATCH:\s*([^\]|]+?)\s*TO\s*([^\]|]+?)\s*(?:\|\s*([^\]|]+?)\s*\|\s*([^\]|]+?)\s*)?\]/i;
  const dispatchMatch = aiResponse.match(dispatchRegex);
  if (dispatchMatch) {
    const origin = dispatchMatch[1].trim();
    const destination = dispatchMatch[2].trim();
    const passengerName = dispatchMatch[3] ? dispatchMatch[3].trim() : 'Pasajero Chat';
    const passengerPhone = dispatchMatch[4] ? dispatchMatch[4].trim() : 'No provisto';

    try {
      const estimation = await estimateTravelCabFare(origin, destination);
      const tripRef = await addDoc(collection(db, 'trips'), {
        passengerName,
        passengerPhone,
        origin,
        destination,
        status: 'Buscando Chofer',
        price: estimation.cost,
        distanceKm: estimation.distanceKm,
        durationMinutes: estimation.durationMin,
        serviceType: 'MU',
        paymentMethod: 'Efectivo',
        category: 'estandar',
        createdAt: Date.now(),
        source: 'travis_ai_dispatch'
      });

      const confirmationText = `\n\n🚕 **TRASLADO PROGRAMADO Y DESPACHADO:**\n` +
                               `• **Código de Viaje:** ${tripRef.id}\n` +
                               `• **Origen:** ${origin}\n` +
                               `• **Destino:** ${destination}\n` +
                               `• **Tarifa Estimada:** $${estimation.cost.toLocaleString('es-AR')} ARS\n` +
                               `Estamos buscando tu conductor. Te notificaremos al instante en que acepte el viaje. 🙌`;

      aiResponse = aiResponse.replace(dispatchRegex, confirmationText);
    } catch (dispatchErr) {
      console.error('[Travis Dispatch] Error creating trip from chat:', dispatchErr);
      aiResponse = aiResponse.replace(dispatchRegex, '\n*(Error interno al procesar el despacho del viaje)*');
    }
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
