import { NextResponse } from 'next/server';
import { sendOutboundMessage } from '@launchramp/api';
import { createActivity } from '@launchramp/api';
import { prisma } from '@launchramp/db';
import { getCurrentOrgId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const orgId = getCurrentOrgId();
    const body = await request.json();
    const { conversationId, text: messageBody, mediaUrls } = body;

    if (!conversationId || !messageBody) {
      return NextResponse.json(
        { error: 'conversationId and text are required' },
        { status: 400 }
      );
    }

    const message = await sendOutboundMessage({
      conversationId,
      body: messageBody,
      mediaUrls,
    });

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });
    if (conv) {
      await createActivity({
        organizationId: orgId,
        contactId: conv.contactId,
        type: 'message_sent',
        messageId: message.id,
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('[POST /api/messages]', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
