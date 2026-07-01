// =============================================================================
// WEBHOOK — ManyChat → TravelApp
// Recibe mensajes de WhatsApp, Instagram DM y Messenger enviados por usuarios
// a través de ManyChat y los procesa en el sistema de mensajería.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { serverGetDoc, serverGetDocs, serverAddDoc, serverUpdateDoc } from '@/lib/firestore-server';
import { Conversation, Message, MessageChannel, ConversationStatus } from '@/types/messaging';
import { processTravisMessage } from '../../travis/chat/route';

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

async function callTravis(
  message: string, 
  conversationHistory: { role: string; content: string }[], 
  businessUnit: string,
  conversationId?: string
): Promise<string | null> {
  try {
    const result = await processTravisMessage(message, conversationHistory, businessUnit, conversationId);
    return result.response;
  } catch (err) {
    console.error('[ManyChat Webhook] Error calling processTravisMessage:', err);
    return null;
  }
}

async function sendManyChatReply(subscriberId: string, message: string): Promise<boolean> {
  const token = process.env.MANYCHAT_API_TOKEN;
  if (!token || token === 'TU_MANYCHAT_API_TOKEN_AQUI') return false;
  
  const fieldId = process.env.MANYCHAT_TRAVIS_RESPONSE_FIELD_ID;
  const useField = fieldId && fieldId !== 'TU_FIELD_ID_AQUI' && fieldId.trim() !== '';

  try {
    if (useField) {
      // Set subscriber custom user field in ManyChat to support WhatsApp, Instagram DM, Comments, etc.
      const response = await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriber_id: subscriberId,
          field_id: fieldId,
          field_value: message,
        }),
      });
      return response.ok;
    } else {
      // Fallback: direct sendContent (Messenger/Facebook)
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
    }
  } catch (err) {
    console.error('[ManyChat Webhook] Error sending reply to ManyChat:', err);
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
      message: userMessage,
      phone,
      email,
    } = body;

    if (!subscriberId || !userMessage) {
      return NextResponse.json({ error: 'Missing subscriber_id or message' }, { status: 400 });
    }

    // Auto-detect channel based on payload fields
    let rawChannel = body.channel;
    if (!rawChannel || rawChannel.trim() === '') {
      if (body.whatsapp_id || body.phone) {
        rawChannel = 'whatsapp';
      } else if (body.instagram_username || body.instagram_id) {
        rawChannel = 'instagram';
      } else if (body.facebook_id || body.messenger_id) {
        rawChannel = 'messenger';
      } else {
        rawChannel = 'web';
      }
    }

    const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Usuario';
    const channel = detectChannel(rawChannel);
    const businessUnit = detectBusinessUnit(userMessage);

    // 1. Buscar conversación existente para este suscriptor de ManyChat
    const existingSnap = await serverGetDocs('conversations', {
      where: [
        ['manyChatSubscriberId', '==', subscriberId]
      ]
    });

    let conversationId: string;
    let conversationStatus: ConversationStatus;
    let isNewConversation = false;

    const activeDoc = existingSnap.docs.find(d => d.data().status !== 'closed');

    if (activeDoc) {
      // Conversación existente
      conversationId = activeDoc.id;
      conversationStatus = activeDoc.data().status as ConversationStatus;
      
      // Actualizar lastMessage y timestamp
      await serverUpdateDoc('conversations', conversationId, {
        lastMessage: userMessage.substring(0, 100),
        lastMessageAt: Date.now(),
        unreadCount: (activeDoc.data().unreadCount || 0) + 1,
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
      const newDoc = await serverAddDoc('conversations', newConversation);
      conversationId = newDoc.id;

      // También crear/actualizar lead en CRM
      if (phone) {
        const existingLeadSnap = await serverGetDocs('leads', {
          where: [['phone', '==', phone]],
          limit: 1
        });
        if (existingLeadSnap.empty) {
          await serverAddDoc('leads', {
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
    }

    let travisReply = '';

    // 2. Guardar el mensaje del cliente en Firestore
    const messageData: Omit<Message, 'id'> = {
      conversationId,
      sender: { id: subscriberId, name: customerName, role: 'customer' },
      content: userMessage,
      timestamp: Date.now(),
      type: 'text',
      channel,
    };
    await serverAddDoc(`conversations/${conversationId}/messages`, messageData);

    // 3. Si el bot está activo y no hay operador, llamar a Travis (protegido contra fallos)
    if (conversationStatus === 'bot') {
      try {
        // Obtener historial reciente para dar contexto a Travis
        const historySnap = await serverGetDocs(`conversations/${conversationId}/messages`, {
          orderBy: [['timestamp', 'desc']],
          limit: 10
        });
        const history = historySnap.docs
          .map(d => d.data())
          .reverse()
          .map(m => ({
            role: m.sender.role === 'customer' ? 'user' : 'assistant',
            content: m.content,
          }));

        const reply = await callTravis(userMessage, history, businessUnit, conversationId);
        
        if (reply) {
          travisReply = reply;
          // Guardar respuesta de Travis en Firestore
          await serverAddDoc(`conversations/${conversationId}/messages`, {
            conversationId,
            sender: { id: 'travis', name: 'Travis', role: 'travis' },
            content: travisReply,
            timestamp: Date.now() + 1,
            type: 'text',
            channel,
          });

          // Enviar via ManyChat (deshabilitado para evitar loops/timeouts, ManyChat lee el JSON de respuesta directamente)
          // await sendManyChatReply(subscriberId, travisReply);
        }
      } catch (travisError) {
        console.error('[ManyChat Webhook] Error al llamar a Travis:', travisError);
        // No arrojamos el error hacia afuera para evitar tirar abajo el webhook
      }
    }

    return NextResponse.json({ 
      success: true, 
      conversationId,
      isNewConversation,
      businessUnit,
      response: travisReply,
    });

  } catch (error: any) {
    console.error('[ManyChat Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
