// =============================================================================
// META WHATSAPP WEBHOOK — TravelApp Ecosystem
// Omnichannel Gateway & Travis AI Multimodal Engine
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation, Message, MessageChannel, ConversationStatus } from '@/types/messaging';
import { processTravisMessage, detectDetailedBusinessUnit } from '@/app/api/travis/chat/route';
import {
  getMetaWhatsAppConfig,
  sendWhatsAppTextMessage,
  sendWhatsAppInteractiveButtons,
  markWhatsAppMessageAsRead,
  fetchMetaMediaAsBase64,
} from '@/lib/meta-whatsapp';

// -----------------------------------------------------------------------------
// GET: Verificación del Webhook de Meta (Handshake inicial)
// -----------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const { verifyToken } = getMetaWhatsAppConfig();

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Meta Webhook] Verificado con éxito por Meta.');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.warn(`[Meta Webhook] Token de verificación inválido. Recibido: "${token}", Esperado: "${verifyToken}"`);
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// -----------------------------------------------------------------------------
// POST: Recepción de Eventos y Mensajes de WhatsApp
// -----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 1. Extraer objeto de cambio de Meta
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const val = change?.value;
    
    // Ignorar eventos de estado (sent, delivered, read) si no traen mensajes
    if (val?.statuses && !val?.messages) {
      return NextResponse.json({ status: 'status_ack' });
    }

    const msg = val?.messages?.[0];
    if (!msg) {
      return NextResponse.json({ status: 'ignored' });
    }

    const phone_number_id = val.metadata?.phone_number_id;
    const from = msg.from; // Número de teléfono del usuario (ej: 549381...)
    const senderName = val.contacts?.[0]?.profile?.name || `Usuario (${from})`;
    const channel: MessageChannel = 'whatsapp';
    const messageId = msg.id;

    // 2. Marcar inmediatamente el mensaje como leído en WhatsApp (doble tilde azul)
    if (messageId) {
      markWhatsAppMessageAsRead(messageId, { phoneNumberId: phone_number_id }).catch(() => {});
    }

    // 3. Procesar distintos tipos de mensajes entrantes
    let userMessage = '';
    let audioInput: { base64: string; mimeType: string } | undefined = undefined;

    if (msg.type === 'text') {
      userMessage = msg.text?.body || '';
    } else if (msg.type === 'audio') {
      const audioId = msg.audio?.id;
      if (audioId) {
        const audioData = await fetchMetaMediaAsBase64(audioId);
        if (audioData) {
          audioInput = audioData;
          userMessage = '[Nota de voz de WhatsApp recibida]';
        } else {
          userMessage = 'Te envié un mensaje de voz pero no se pudo reproducir.';
        }
      }
    } else if (msg.type === 'location') {
      const lat = msg.location?.latitude;
      const lng = msg.location?.longitude;
      const address = msg.location?.address || '';
      const name = msg.location?.name || '';
      userMessage = `Mi ubicación actual es: ${name ? name + ' - ' : ''}${address} (Coordenadas: ${lat}, ${lng})`;
    } else if (msg.type === 'interactive') {
      if (msg.interactive?.type === 'button_reply') {
        userMessage = msg.interactive.button_reply?.title || '';
      } else if (msg.interactive?.type === 'list_reply') {
        userMessage = msg.interactive.list_reply?.title || '';
      }
    } else if (msg.type === 'image') {
      userMessage = msg.image?.caption || 'Te comparto esta foto.';
    }

    if (!userMessage && !audioInput) {
      return NextResponse.json({ status: 'no_supported_content' });
    }

    console.log(`[Meta Webhook] Mensaje (${msg.type}) de ${senderName} (${from}): "${userMessage}"`);

    // 4. Detectar unidad de negocio sugerida (6 unidades oficiales)
    const businessUnit = detectDetailedBusinessUnit(userMessage);

    // 5. Buscar conversación activa en Firestore (compatibilidad completa con /messages)
    const convsRef = collection(db, 'conversations');
    const qConvs = query(
      convsRef,
      where('channel', '==', channel),
      where('externalId', '==', from),
      where('status', 'in', ['bot', 'pending', 'active']),
      limit(1)
    );
    const snapConvs = await getDocs(qConvs);

    let conversationId = '';
    let conversationStatus: ConversationStatus = 'bot';

    if (!snapConvs.empty) {
      const docConv = snapConvs.docs[0];
      conversationId = docConv.id;
      const docData = docConv.data();
      conversationStatus = docData.status as ConversationStatus;
      
      // Actualizar timestamp y último mensaje
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: userMessage,
        lastMessageAt: Date.now(),
        unreadCount: (docData.unreadCount || 0) + 1,
        'metadata.businessUnit': businessUnit,
      });
    } else {
      // Crear nueva conversación estructurada según modelo Conversation
      const newConversation: Omit<Conversation, 'id'> = {
        type: 'customer_support',
        channel,
        status: 'bot',
        participants: [
          { id: from, name: senderName, role: 'customer', phone: from },
          { id: 'travis', name: 'Travis IA', role: 'travis' },
        ],
        lastMessage: userMessage,
        lastMessageAt: Date.now(),
        unreadCount: 1,
        metadata: {
          businessUnit,
          passengerName: senderName,
        },
        createdAt: Date.now(),
      };

      const newDoc = await addDoc(convsRef, {
        ...newConversation,
        externalId: from,
        customerName: senderName,
      });
      conversationId = newDoc.id;

      // Crear o sincronizar Lead en el CRM de Firestore
      try {
        const leadsRef = collection(db, 'leads');
        await addDoc(leadsRef, {
          customerName: senderName,
          phone: from,
          origin: 'WhatsApp',
          status: 'Nuevos',
          customerStatus: 'Prospecto',
          customerLevel: 1,
          businessUnit,
          chatHistory: [{ sender: 'Client', message: userMessage, timestamp: Date.now() }],
          conversationId,
          createdAt: Date.now(),
          lastInteraction: Date.now(),
        });
      } catch (crmErr) {
        console.warn('[Meta Webhook] Error creating lead:', crmErr);
      }
    }

    // 6. Registrar mensaje del usuario en la subcolección de Firestore
    const userMsgData: Omit<Message, 'id'> = {
      conversationId,
      sender: { id: from, name: senderName, role: 'customer' },
      content: userMessage,
      timestamp: Date.now(),
      type: msg.type === 'audio' ? 'text' : (msg.type as any) || 'text',
      channel,
      isRead: true,
    };
    await addDoc(collection(db, `conversations/${conversationId}/messages`), userMsgData);

    // 7. Si la conversación está en modo 'bot', responder usando Travis IA
    if (conversationStatus === 'bot') {
      // Cargar historial reciente de la conversación
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
          role: m.sender?.role === 'customer' ? 'user' : 'assistant',
          content: m.content || '',
        }));

      // Procesar respuesta con el motor cognitivo de Travis
      const travisResult = await processTravisMessage(
        userMessage, 
        history, 
        businessUnit, 
        conversationId, 
        audioInput
      );
      
      const travisReply = travisResult.response;

      if (travisReply) {
        // Enviar respuesta a WhatsApp usando Meta Cloud API
        if (travisResult.buttons && travisResult.buttons.length > 0) {
          // Enviar con botones interactivos si Travis generó opciones
          await sendWhatsAppInteractiveButtons(
            from,
            travisReply,
            travisResult.buttons,
            { phoneNumberId: phone_number_id }
          );
        } else {
          // Enviar texto regular
          await sendWhatsAppTextMessage(
            from,
            travisReply,
            { phoneNumberId: phone_number_id }
          );
        }

        // Registrar respuesta de Travis en Firestore
        await addDoc(collection(db, `conversations/${conversationId}/messages`), {
          conversationId,
          sender: { id: 'travis', name: 'Travis IA', role: 'travis' },
          content: travisReply,
          timestamp: Date.now() + 1,
          type: 'text',
          channel,
          isRead: false,
        });

        // Actualizar último mensaje de la conversación
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: travisReply.substring(0, 120),
          lastMessageAt: Date.now(),
        });
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('[Meta Webhook] Error procesando notificación:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
