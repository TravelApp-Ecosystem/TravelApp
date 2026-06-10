// =============================================================================
// BROADCAST — Envío de campañas de mensajería segmentadas
// Permite al equipo enviar mensajes a todos, solo pasajeros, solo conductores
// o a usuarios/conductores específicos por ID.
//
// POST /api/broadcast
// Body: { title, message, audience, channel, specificIds? }
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BroadcastCampaign, BroadcastAudience, MessageChannel } from '@/types/messaging';

async function sendViaManyChatBroadcast(subscriberIds: string[], message: string): Promise<{ sent: number; failed: number }> {
  const token = process.env.MANYCHAT_API_TOKEN;
  if (!token || token === 'TU_MANYCHAT_API_TOKEN_AQUI') {
    return { sent: 0, failed: subscriberIds.length };
  }

  let sent = 0;
  let failed = 0;

  for (const subscriberId of subscriberIds) {
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
      if (response.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
    // Rate limiting: esperar 100ms entre envíos
    await new Promise(r => setTimeout(r, 100));
  }

  return { sent, failed };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      message,
      audience,
      channel,
      specificIds = [],
      createdBy = 'admin',
      scheduledAt,
    }: {
      title: string;
      message: string;
      audience: BroadcastAudience;
      channel: MessageChannel | 'both';
      specificIds?: string[];
      createdBy?: string;
      scheduledAt?: number;
    } = body;

    if (!title || !message || !audience) {
      return NextResponse.json({ error: 'Missing required fields: title, message, audience' }, { status: 400 });
    }

    // 1. Obtener los destinatarios desde Firestore según la audiencia
    let manyChatSubscriberIds: string[] = [];
    let targetedCount = 0;

    if (audience === 'specific' && specificIds.length > 0) {
      manyChatSubscriberIds = specificIds;
      targetedCount = specificIds.length;
    } else {
      // Obtener leads/conversaciones con suscriptores de ManyChat
      const convsRef = collection(db, 'conversations');
      let q;
      
      if (audience === 'all') {
        q = query(convsRef, where('status', '!=', 'closed'));
      } else if (audience === 'passengers') {
        q = query(convsRef, where('type', '==', 'customer_support'));
      } else if (audience === 'drivers') {
        q = query(convsRef, where('type', '==', 'driver_passenger'));
      } else {
        q = query(convsRef);
      }

      const convsSnap = await getDocs(q);
      const seenIds = new Set<string>();
      convsSnap.docs.forEach(d => {
        const subscriberId = d.data().manyChatSubscriberId;
        if (subscriberId && !seenIds.has(subscriberId)) {
          seenIds.add(subscriberId);
          manyChatSubscriberIds.push(subscriberId);
        }
      });
      targetedCount = manyChatSubscriberIds.length;
    }

    const isScheduled = !!scheduledAt && scheduledAt > Date.now();

    // 2. Guardar la campaña en Firestore (estado: scheduled o sending)
    const campaign: Omit<BroadcastCampaign, 'id'> = {
      title,
      message,
      audience,
      specificIds: audience === 'specific' ? specificIds : undefined,
      channel,
      status: isScheduled ? 'scheduled' : 'sending',
      scheduledAt: scheduledAt || undefined,
      sentAt: isScheduled ? undefined : Date.now(),
      stats: { targeted: targetedCount, sent: 0, delivered: 0, read: 0 },
      createdBy,
      createdAt: Date.now(),
    };
    const campaignDoc = await addDoc(collection(db, 'broadcastCampaigns'), campaign);

    // Si está programada, retornamos de inmediato
    if (isScheduled) {
      return NextResponse.json({
        success: true,
        campaignId: campaignDoc.id,
        scheduled: true,
        stats: campaign.stats
      });
    }

    // 3. Guardar en la colección `notifications` para notificaciones internas (push)
    if (channel === 'push' || channel === 'both' || channel === 'internal') {
      await addDoc(collection(db, 'notifications'), {
        title: `📢 ${title}`,
        message,
        timestamp: Date.now(),
        read: false,
        type: 'alert',
        broadcastId: campaignDoc.id,
        audience,
      });
    }

    // 4. Enviar via ManyChat (WhatsApp/Messenger) si corresponde
    let manyChatStats = { sent: 0, failed: 0 };
    if ((channel === 'whatsapp' || channel === 'both') && manyChatSubscriberIds.length > 0) {
      manyChatStats = await sendViaManyChatBroadcast(manyChatSubscriberIds, message);
    }

    // 5. Actualizar stats de la campaña existente
    const finalStats: BroadcastCampaign['stats'] = {
      targeted: targetedCount,
      sent: channel === 'push' ? targetedCount : manyChatStats.sent,
      delivered: 0,
      read: 0,
    };

    await updateDoc(doc(db, 'broadcastCampaigns', campaignDoc.id), {
      status: 'sent',
      sentAt: Date.now(),
      stats: finalStats,
    });

    return NextResponse.json({
      success: true,
      campaignId: campaignDoc.id,
      stats: finalStats,
      manyChatEnabled: process.env.MANYCHAT_API_TOKEN !== 'TU_MANYCHAT_API_TOKEN_AQUI',
    });

  } catch (error: any) {
    console.error('[Broadcast API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
