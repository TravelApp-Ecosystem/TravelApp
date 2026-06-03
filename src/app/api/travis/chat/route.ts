// =============================================================================
// TRAVIS IA — Endpoint interno para probar y entrenar a Travis
// Usado por el panel CRM para enviar mensajes de prueba y obtener respuestas.
//
// POST /api/travis/chat
// Body: { message, conversationId?, businessUnit?, systemPromptOverride? }
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TravisConfig, DEFAULT_TRAVIS_CONFIG } from '@/types/messaging';

async function getTravisConfig(): Promise<TravisConfig> {
  try {
    const configDoc = await getDoc(doc(db, 'travisConfig', 'main'));
    if (configDoc.exists()) {
      return configDoc.data() as TravisConfig;
    }
  } catch { /* use default */ }
  return { ...DEFAULT_TRAVIS_CONFIG, updatedAt: Date.now() };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      message, 
      conversationId, 
      businessUnit = 'General',
      history = [],
      systemPromptOverride 
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Cargar configuración de Travis desde Firestore
    const config = await getTravisConfig();
    const systemPrompt = systemPromptOverride || config.systemPrompt;

    // Verificar si hay handoff triggers en el mensaje
    const needsHandoff = config.handoffTriggers.some(trigger =>
      message.toLowerCase().includes(trigger.toLowerCase())
    );
    if (needsHandoff) {
      return NextResponse.json({
        response: 'Entendido. En este momento te conecto con un miembro de nuestro equipo que podrá ayudarte mejor. Por favor, aguardá un instante. 🙏',
        needsHandoff: true,
        businessUnit,
      });
    }

    // Llamar al Cloud Function de Travis (Google Cloud)
    const travisUrl = process.env.TRAVIS_WEBHOOK_URL;
    
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
            knowledgeBase: config.knowledgeBase?.map(k => `## ${k.title}\n${k.content}`).join('\n\n') || '',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const travisResponse = data.response || data.message || data.reply || data.text;
          if (travisResponse) {
            return NextResponse.json({
              response: travisResponse,
              businessUnit,
              source: 'cloud_function',
              needsHandoff: false,
            });
          }
        }
      } catch (err) {
        console.warn('[Travis] Cloud Function call failed, falling back to mock:', err);
      }
    }

    // Fallback: respuesta mock mientras se configura Travis
    const mockResponses: Record<string, string> = {
      TravelCab: `¡Hola! 👋 Soy Travis, el asistente de TravelCab. Para pedir tu viaje o consultarnos sobre tarifas, podés usar el despachador en nuestra web o escribirnos directamente. ¿En qué te puedo ayudar hoy?`,
      Experiences: `¡Hola! 🌟 Soy Travis, asistente de TravelExperiences. Contamos con increíbles tours y experiencias en Tucumán y alrededores. ¿Querés conocer nuestros próximos viajes disponibles?`,
      Rewards: `¡Hola! 🎁 Soy Travis. El programa TravelRewards te da puntos en cada viaje que podés canjear por beneficios exclusivos. ¿Querés saber cuántos puntos tenés o cómo canjearlos?`,
      General: `¡Hola! Soy Travis, asistente virtual de TravelApp. Puedo ayudarte con información sobre nuestros servicios de transporte (TravelCab), experiencias y tours (TravelExperiences), y nuestro programa de fidelización (TravelRewards). ¿Sobre qué te puedo orientar?`,
    };

    return NextResponse.json({
      response: mockResponses[businessUnit] || mockResponses.General,
      businessUnit,
      source: 'mock_fallback',
      needsHandoff: false,
      warning: 'Travis Cloud Function not configured. Using mock response.',
    });

  } catch (error: any) {
    console.error('[Travis Chat API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
