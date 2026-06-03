// =============================================================================
// WEBHOOK — ManyChat → TravelApp
// Recibe mensajes de WhatsApp, Instagram DM y Messenger enviados por usuarios
// a través de ManyChat y los procesa en el sistema de mensajería.
//
// ManyChat lo llama automáticamente cuando un usuario envía un mensaje.
// URL: POST /api/webhooks/manychat
// Header requerido: x-webhook-secret: [valor de WEBHOOK_SECRET en .env.local]
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation, Message, MessageChannel, ConversationStatus } from '@/types/messaging';

// ----- Helpers ----------------------------------------------------------------

function detectChannel(rawChannel: string): MessageChannel {
  const ch = rawChannel?.toLowerCase() || '';
  if (ch.includes('instagram')) return 'instagram';
  if (ch.includes('messenger') || ch.includes('facebook')) return 'messenger';
  if (ch.includes('whatsapp')) return 'whatsapp';
  return 'web';
}

function detectBusinessUnit(message: string): 'TravelCab' | 'Experiences' | 'Rewards' | 'General' {
  const msg = message?.toLowerCase() || '';
  if (msg.includes('remis') || msg.includes('taxi') || msg.includes('viaje') || msg.includes('conductor') || msg.includes('chofer') || msg.includes('travelcab')) {
    return 'TravelCab';
  }
  if (msg.includes('tour') || msg.includes('excursion') || msg.includes('experiencia') || msg.includes('viaje grupal')) {
    return 'Experiences';
  }
  if (msg.includes('punto') || msg.includes('reward') || msg.includes('beneficio') || msg.includes('canje')) {
    return 'Rewards';
  }
  return 'General';
}

async function callTravis(message: string, conversationHistory: { role: string; content: string }[], businessUnit: string): Promise<string | null> {
  const travisUrl = process.env.TRAVIS_WEBHOOK_URL;
  if (!travisUrl || travisUrl.includes('cloudfunctions.net/travis-webhook') === false) {
    return null;
  }
  try {
    const response = await fetch(travisUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(process.env.TRAVIS_WEBHOOK_SECRET ? { 'x-webhook-secret': process.env.TRAVIS_WEBHOOK_SECRET } : {})
      },
      body: JSON.stringify({ message, history: conversationHistory, businessUnit }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.response || data.message || data.reply || null;
  } catch {
    return null;
  }
}

async function sendManyChatReply(subscriberId: string, message: string): Promise<boolean> {
  const token = process.env.MANYCHAT_API_TOKEN;
  if (!token || token === 'TU_MANYCHAT_API_TOKEN_AQUI') return false;
  
  try {
    const response = await fetch('https://api.manychat.com/fb/sending/sendContent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        data: {
          version: 'v2',
          content: {
            messages: [{ type: 'text', text: message }],
          },
        },
        message_tag: 'ACCOUNT_UPDATE',
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ----- Main Handler -----------------------------------------------------------

export async function POST(req: NextRequest) {
  // Verificar el secret del webhook
  const secret = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Payload esperado de ManyChat (customizable via Zapier):
    // { subscriber_id, first_name, last_name, channel, message, phone?, email? }
    const {
      subscriber_id: subscriberId,
      first_name: firstName,
      last_name: lastName,
      channel: rawChannel,
      message: userMessage,
      phone,
      email,
    } = body;

    if (!subscriberId || !userMessage) {
      return NextResponse.json({ error: 'Missing subscriber_id or message' }, { status: 400 });
    }

    const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Usuario';
    const channel = detectChannel(rawChannel);
    const businessUnit = detectBusinessUnit(userMessage);

    // 1. Buscar conversación existente para este suscriptor de ManyChat
    const convsRef = collection(db, 'conversations');
    const existingQuery = query(
      convsRef,
      where('manyChatSubscriberId', '==', subscriberId),
      where('status', '!=', 'closed'),
      limit(1)
    );
    const existingSnap = await getDocs(existingQuery);

    let conversationId: string;
    let conversationStatus: ConversationStatus;
    let isNewConversation = false;

    if (!existingSnap.empty) {
      // Conversación existente
      const existingDoc = existingSnap.docs[0];
      conversationId = existingDoc.id;
      conversationStatus = existingDoc.data().status as ConversationStatus;
      
      // Actualizar lastMessage y timestamp
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: userMessage.substring(0, 100),
        lastMessageAt: Date.now(),
        unreadCount: (existingDoc.data().unreadCount || 0) + 1,
        'metadata.businessUnit': businessUnit,
      });
    } else {
      // Nueva conversación
      isNewConversation = true;
      conversationStatus = 'bot';
      const newConversation: Omit<Conversation, 'id'> = {
        type: 'customer_support',
        channel,
        participants: [{
          id: subscriberId,
          name: customerName,
          role: 'customer',
          phone: phone || '',
        }],
        status: 'bot',
        lastMessage: userMessage.substring(0, 100),
        lastMessageAt: Date.now(),
        unreadCount: 1,
        manyChatSubscriberId: subscriberId,
        metadata: {
          businessUnit,
        },
        createdAt: Date.now(),
      };
      const newDoc = await addDoc(convsRef, newConversation);
      conversationId = newDoc.id;

      // También crear/actualizar lead en CRM
      const leadsRef = collection(db, 'leads');
      const existingLeadQuery = query(leadsRef, where('phone', '==', phone || ''), limit(1));
      const existingLeadSnap = await getDocs(existingLeadQuery);
      if (existingLeadSnap.empty && (phone || email)) {
        await addDoc(leadsRef, {
          customerName,
          phone: phone || '',
          email: email || '',
          origin: channel === 'whatsapp' ? 'WhatsApp' : channel === 'instagram' ? 'IG' : channel === 'messenger' ? 'Messenger' : 'Web',
          status: 'Nuevos',
          customerStatus: 'Prospecto',
          customerLevel: 1,
          businessUnit,
          chatHistory: [{ sender: 'Client', message: userMessage, timestamp: Date.now() }],
          manyChatSubscriberId: subscriberId,
          conversationId,
        });
      }
    }

    // 2. Guardar el mensaje del cliente en Firestore
    const messageData: Omit<Message, 'id'> = {
      conversationId,
      sender: { id: subscriberId, name: customerName, role: 'customer' },
      content: userMessage,
      timestamp: Date.now(),
      type: 'text',
      channel,
    };
    await addDoc(collection(db, `conversations/${conversationId}/messages`), messageData);

    // 3. Si el bot está activo y no hay operador, llamar a Travis
    if (conversationStatus === 'bot') {
      // Obtener historial reciente para dar contexto a Travis
      const historySnap = await getDocs(
        query(
          collection(db, `conversations/${conversationId}/messages`),
          orderBy('timestamp', 'desc'),
          limit(10)
        )
      );
      const history = historySnap.docs
        .map(d => d.data())
        .reverse()
        .map(m => ({
          role: m.sender.role === 'customer' ? 'user' : 'assistant',
          content: m.content,
        }));

      const travisReply = await callTravis(userMessage, history, businessUnit);
      
      if (travisReply) {
        // Guardar respuesta de Travis en Firestore
        await addDoc(collection(db, `conversations/${conversationId}/messages`), {
          conversationId,
          sender: { id: 'travis', name: 'Travis', role: 'travis' },
          content: travisReply,
          timestamp: Date.now() + 1,
          type: 'text',
          channel,
        });

        // Enviar via ManyChat
        await sendManyChatReply(subscriberId, travisReply);
      }
    }

    return NextResponse.json({ 
      success: true, 
      conversationId,
      isNewConversation,
      businessUnit,
    });

  } catch (error: any) {
    console.error('[ManyChat Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
