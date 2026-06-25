import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation, Message, MessageChannel, ConversationStatus } from '@/types/messaging';
import { processTravisMessage } from '../../travis/chat/route';

// GET: Verificación del webhook de Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN || 'travelapp_verify_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Meta Webhook] Verificado con éxito.');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.warn('[Meta Webhook] Falla en verificación de token.');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// POST: Recibir notificaciones de mensajes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validar estructura de Meta WhatsApp notification
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const val = change?.value;
    const msg = val?.messages?.[0];
    
    if (!msg) {
      // Ignorar actualizaciones de estado u otros eventos no relacionados a mensajes recibidos
      return NextResponse.json({ status: 'ignored' });
    }

    const phone_number_id = val.metadata?.phone_number_id;
    const from = msg.from; // Teléfono del remitente
    const userMessage = msg.text?.body;
    const senderName = val.contacts?.[0]?.profile?.name || `WhatsApp User (${from})`;
    const channel: MessageChannel = 'whatsapp';

    if (!userMessage) {
      return NextResponse.json({ status: 'no_text_body' });
    }

    console.log(`[Meta Webhook] Mensaje recibido de ${senderName} (${from}): "${userMessage}"`);

    // Detectar unidad de negocio basándonos en el contenido (al igual que ManyChat)
    const lowerMsg = userMessage.toLowerCase();
    let businessUnit: 'TravelCab' | 'Experiences' | 'Rewards' | 'General' = 'General';
    if (lowerMsg.includes('remis') || lowerMsg.includes('taxi') || lowerMsg.includes('viaje') || lowerMsg.includes('conductor') || lowerMsg.includes('chofer') || lowerMsg.includes('travelcab')) {
      businessUnit = 'TravelCab';
    } else if (lowerMsg.includes('tour') || lowerMsg.includes('excursion') || lowerMsg.includes('experiencia') || lowerMsg.includes('viaje grupal')) {
      businessUnit = 'Experiences';
    } else if (lowerMsg.includes('punto') || lowerMsg.includes('reward') || lowerMsg.includes('beneficio') || lowerMsg.includes('canje')) {
      businessUnit = 'Rewards';
    }

    // 1. Buscar conversación activa en Firestore
    const convsRef = collection(db, 'conversations');
    const qConvs = query(
      convsRef,
      where('channel', '==', channel),
      where('externalId', '==', from),
      where('status', 'in', ['bot', 'open']),
      limit(1)
    );
    const snapConvs = await getDocs(qConvs);

    let conversationId = '';
    let conversationStatus: ConversationStatus = 'bot';

    if (!snapConvs.empty) {
      const docConv = snapConvs.docs[0];
      conversationId = docConv.id;
      conversationStatus = docConv.data().status as ConversationStatus;
      
      // Actualizar timestamp
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessageAt: Date.now(),
        lastMessageText: userMessage,
      });
    } else {
      // Crear nueva conversación
      const newConversation = {
        externalId: from,
        customerName: senderName,
        channel,
        status: 'bot',
        lastMessageAt: Date.now(),
        lastMessageText: userMessage,
        metadata: {
          businessUnit,
          phone_number_id,
        },
        createdAt: Date.now(),
      };
      const newDoc = await addDoc(convsRef, newConversation);
      conversationId = newDoc.id;

      // Crear lead en CRM
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
      });
    }

    // 2. Registrar el mensaje recibido en Firestore
    const messageData: Omit<Message, 'id'> = {
      conversationId,
      sender: { id: from, name: senderName, role: 'customer' },
      content: userMessage,
      timestamp: Date.now(),
      type: 'text',
      channel,
    };
    await addDoc(collection(db, `conversations/${conversationId}/messages`), messageData);

    // 3. Responder usando Travis IA si corresponde
    if (conversationStatus === 'bot') {
      // Cargar historial de chat reciente para contexto
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

      // Procesar con Travis AI
      const travisResult = await processTravisMessage(userMessage, history, businessUnit, conversationId);
      const travisReply = travisResult.response;

      if (travisReply) {
        // Enviar respuesta por WhatsApp vía API de Meta Cloud
        const metaToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
        if (metaToken && metaToken !== 'TU_META_ACCESS_TOKEN_AQUI') {
          try {
            const sendUrl = `https://graph.facebook.com/v19.0/${phone_number_id || 'me'}/messages`;
            await fetch(sendUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${metaToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: from,
                type: 'text',
                text: {
                  preview_url: false,
                  body: travisReply,
                },
              }),
            });
            console.log(`[Meta Webhook] Respuesta enviada con éxito a ${from} via Meta API.`);
          } catch (sendErr) {
            console.error('[Meta Webhook] Error al enviar mensaje por Meta API:', sendErr);
          }
        } else {
          console.warn('[Meta Webhook] META_WHATSAPP_ACCESS_TOKEN no configurado. Se simuló envío de respuesta.');
        }

        // Registrar respuesta de Travis en la base de datos
        await addDoc(collection(db, `conversations/${conversationId}/messages`), {
          conversationId,
          sender: { id: 'travis', name: 'Travis', role: 'travis' },
          content: travisReply,
          timestamp: Date.now() + 1,
          type: 'text',
          channel,
        });
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('[Meta Webhook] Error procesando el webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
