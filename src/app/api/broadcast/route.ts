// =============================================================================
// BROADCAST — Envío de campañas de mensajería segmentadas
// Permite al equipo enviar mensajes a todos, solo pasajeros, solo conductores
// o a usuarios/conductores específicos por ID.
//
// POST /api/broadcast
// Body: { title, message, audience, channel, specificIds? }
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, getDoc, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BroadcastCampaign, BroadcastAudience, MessageChannel, NotificationAudioType, NotificationCategory } from '@/types/messaging';

/**
 * Enviar notificaciones push a través de la API oficial de Expo
 */
async function sendExpoPushNotifications({
  tokens,
  title,
  message,
  soundAlert = 'default',
  category = 'general',
  data = {},
}: {
  tokens: string[];
  title: string;
  message: string;
  soundAlert?: string;
  category?: string;
  data?: any;
}): Promise<{ sent: number; failed: number }> {
  const validTokens = Array.from(new Set(tokens)).filter(
    (t) => typeof t === 'string' && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))
  );

  if (validTokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // Dividir en bloques de 100 para la API de Expo
  for (let i = 0; i < validTokens.length; i += 100) {
    const batch = validTokens.slice(i, i + 100);
    const messages = batch.map((to) => ({
      to,
      sound: soundAlert === 'none' ? null : 'default',
      title: title.startsWith('📢') ? title : `📢 ${title}`,
      body: message,
      data: { ...data, category, soundAlert },
      priority: 'high',
      channelId: soundAlert === 'driver_alert' ? 'driver_alerts' : 'trip_updates',
      _displayInForeground: true,
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      if (response.ok) {
        sent += batch.length;
      } else {
        failed += batch.length;
      }
    } catch (e) {
      console.error('[Expo Push Send Error]:', e);
      failed += batch.length;
    }
  }

  return { sent, failed };
}

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
      soundAlert = 'default',
      category = 'general',
      specificIds = [],
      createdBy = 'admin',
      scheduledAt,
    }: {
      title: string;
      message: string;
      audience: BroadcastAudience;
      channel: MessageChannel | 'both';
      soundAlert?: NotificationAudioType;
      category?: NotificationCategory;
      specificIds?: string[];
      createdBy?: string;
      scheduledAt?: number;
    } = body;

    if (!title || !message || !audience) {
      return NextResponse.json({ error: 'Missing required fields: title, message, audience' }, { status: 400 });
    }

    // 1. Obtener los destinatarios y push tokens desde Firestore según la audiencia
    let manyChatSubscriberIds: string[] = [];
    const pushTokens: string[] = [];
    let targetedCount = 0;

    if (audience === 'specific' && specificIds.length > 0) {
      manyChatSubscriberIds = specificIds;
      targetedCount = specificIds.length;

      // Buscar push tokens para IDs específicos (en users y drivers)
      for (const id of specificIds) {
        try {
          const uDoc = await getDoc(doc(db, 'users', id));
          if (uDoc.exists()) {
            const data = uDoc.data();
            if (data.pushToken) pushTokens.push(data.pushToken);
            if (data.expoPushToken && data.expoPushToken !== data.pushToken) pushTokens.push(data.expoPushToken);
          }
          const dDoc = await getDoc(doc(db, 'drivers', id));
          if (dDoc.exists()) {
            const data = dDoc.data();
            if (data.pushToken) pushTokens.push(data.pushToken);
            if (data.expoPushToken && data.expoPushToken !== data.pushToken) pushTokens.push(data.expoPushToken);
          }
        } catch (err) {
          console.warn('[Broadcast API] Error fetching token for specific id:', id, err);
        }
      }
    } else {
      // Contar usuarios y extraer push tokens según audiencia (users y drivers)
      try {
        if (audience === 'all' || audience === 'passengers') {
          const uSnap = await getDocs(collection(db, 'users'));
          targetedCount += uSnap.size;
          uSnap.forEach(d => {
            const data = d.data();
            if (data.pushToken) pushTokens.push(data.pushToken);
            if (data.expoPushToken && data.expoPushToken !== data.pushToken) pushTokens.push(data.expoPushToken);
          });
        }
        if (audience === 'all' || audience === 'drivers') {
          const dSnap = await getDocs(collection(db, 'drivers'));
          targetedCount += dSnap.size;
          dSnap.forEach(d => {
            const data = d.data();
            if (data.pushToken) pushTokens.push(data.pushToken);
            if (data.expoPushToken && data.expoPushToken !== data.pushToken) pushTokens.push(data.expoPushToken);
          });
        }
        if (targetedCount === 0) targetedCount = 1;
      } catch (e) {
        console.warn('[Broadcast API] Error querying users/drivers:', e);
        targetedCount = 1;
      }

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

      try {
        const convsSnap = await getDocs(q);
        const seenIds = new Set<string>();
        convsSnap.docs.forEach(d => {
          const subscriberId = d.data().manyChatSubscriberId;
          if (subscriberId && !seenIds.has(subscriberId)) {
            seenIds.add(subscriberId);
            manyChatSubscriberIds.push(subscriberId);
          }
        });
      } catch (err) {
        console.warn('ManyChat convs query warning:', err);
      }
    }

    const isScheduled = !!scheduledAt && scheduledAt > Date.now();

    // 2. Guardar la campaña en Firestore (estado: scheduled o sending)
    const campaign: Omit<BroadcastCampaign, 'id'> = {
      title,
      message,
      audience,
      specificIds: audience === 'specific' ? specificIds : undefined,
      channel,
      soundAlert,
      category,
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

    // 3. Guardar en la colección `notifications` para notificaciones en vivo en las apps móviles
    let pushNotificationDocId = '';
    if (channel === 'push' || channel === 'both' || channel === 'internal') {
      const notifDoc = await addDoc(collection(db, 'notifications'), {
        title: title.startsWith('📢') ? title : `📢 ${title}`,
        message,
        timestamp: Date.now(),
        createdAt: Date.now(),
        read: false,
        type: 'alert',
        soundAlert,
        category,
        broadcastId: campaignDoc.id,
        audience,
        specificIds: audience === 'specific' ? specificIds : null,
        targetUserId: audience === 'specific' && specificIds.length === 1 ? specificIds[0] : null,
      });
      pushNotificationDocId = notifDoc.id;
    }

    // 4. Enviar vía Expo Push Notifications si hay tokens disponibles
    let expoPushStats = { sent: 0, failed: 0 };
    if ((channel === 'push' || channel === 'both') && pushTokens.length > 0) {
      expoPushStats = await sendExpoPushNotifications({
        tokens: pushTokens,
        title,
        message,
        soundAlert,
        category,
        data: {
          broadcastId: campaignDoc.id,
          notificationId: pushNotificationDocId,
          audience,
          category,
        },
      });
    }

    // 5. Enviar via ManyChat (WhatsApp/Messenger) si corresponde
    let manyChatStats = { sent: 0, failed: 0 };
    if ((channel === 'whatsapp' || channel === 'both') && manyChatSubscriberIds.length > 0) {
      manyChatStats = await sendViaManyChatBroadcast(manyChatSubscriberIds, message);
    }

    // 6. Actualizar stats de la campaña existente
    const finalStats: BroadcastCampaign['stats'] = {
      targeted: targetedCount,
      sent: expoPushStats.sent || manyChatStats.sent || targetedCount,
      delivered: targetedCount,
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
      expoPushSent: expoPushStats.sent,
      manyChatEnabled: process.env.MANYCHAT_API_TOKEN !== 'TU_MANYCHAT_API_TOKEN_AQUI',
    });

  } catch (error: any) {
    console.error('[Broadcast API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
