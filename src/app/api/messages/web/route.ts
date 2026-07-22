import { NextRequest, NextResponse } from 'next/server';
import { serverAddDoc, serverGetDoc, serverSetDoc, serverGetDocs, serverUpdateDoc } from '@/lib/firestore-server';
import { processTravisMessage } from '@/app/api/travis/chat/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, userMessage, userName = 'Usuario Web', userEmail = '' } = body;

    if (!userMessage || !userMessage.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const id = conversationId || `web_chat_${Date.now()}`;
    const timestamp = Date.now();

    // 1. Ensure conversation document exists
    const convRef = `conversations/${id}`;
    let convDoc = await serverGetDoc('conversations', id);

    if (!convDoc.exists()) {
      await serverSetDoc('conversations', id, {
        channel: 'web',
        status: 'bot',
        participants: [
          { id: 'web_user', name: userName, email: userEmail, role: 'customer' },
          { id: 'travis', name: 'Travis IA', role: 'travis' }
        ],
        lastMessage: {
          content: userMessage,
          timestamp,
          senderId: 'web_user'
        },
        unreadCount: 1,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    } else {
      await serverSetDoc('conversations', id, {
        lastMessage: {
          content: userMessage,
          timestamp,
          senderId: 'web_user'
        },
        updatedAt: timestamp
      }, { merge: true });
    }

    // 2. Save user message in subcollection
    const userMsgData = {
      conversationId: id,
      sender: { id: 'web_user', name: userName, role: 'customer' },
      content: userMessage,
      channel: 'web',
      timestamp,
      status: 'delivered'
    };
    await serverAddDoc(`conversations/${id}/messages`, userMsgData);

    // 3. Check if Travis should auto-reply
    convDoc = await serverGetDoc('conversations', id);
    const convData = convDoc.data();
    let travisReplyText = '';

    if (convData?.status === 'bot') {
      // Get last 10 messages for context
      const historySnap = await serverGetDocs(`conversations/${id}/messages`, {
        orderBy: [{ field: 'timestamp', direction: 'asc' }],
        limit: 10
      });

      const history = historySnap.docs.map(d => {
        const data = d.data();
        return {
          role: data.sender?.role === 'travis' ? 'assistant' : 'user',
          content: data.content || ''
        };
      });

      // Call Travis AI engine directly without ManyChat
      const travisResult = await processTravisMessage(userMessage, history, 'Experiences', id);
      travisReplyText = travisResult.response || 'Hola, ¿en qué te puedo ayudar sobre nuestras experiencias de viaje?';

      // Save Travis message in Firestore
      const travisMsgData = {
        conversationId: id,
        sender: { id: 'travis', name: 'Travis IA', role: 'travis' },
        content: travisReplyText,
        channel: 'web',
        timestamp: Date.now(),
        status: 'delivered'
      };
      await serverAddDoc(`conversations/${id}/messages`, travisMsgData);
    }

    return NextResponse.json({
      success: true,
      conversationId: id,
      response: travisReplyText
    });
  } catch (error) {
    console.error('[Web Chat API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
