import { NextResponse } from 'next/server';
import {
  sendOutboundMessage,
  createActivity,
  toMessageResponseDto,
} from '@launchramp/api';
import { prisma } from '@launchramp/db';
import { getCurrentOrgId } from '@/lib/auth';
import type {
  PostMessagesErrorResponse,
  PostMessagesSuccessResponse,
} from '@launchramp/shared';

type PostBody = {
  conversationId?: string;
  text?: string;
  mediaUrls?: string[];
};

export async function POST(request: Request) {
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    const err: PostMessagesErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON body',
      },
    };
    return NextResponse.json(err, { status: 400 });
  }

  const { conversationId, text: messageBody, mediaUrls } = body;

  if (!conversationId || typeof conversationId !== 'string') {
    const err: PostMessagesErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'conversationId is required',
      },
    };
    return NextResponse.json(err, { status: 400 });
  }

  if (!messageBody || typeof messageBody !== 'string' || !messageBody.trim()) {
    const err: PostMessagesErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'text is required',
      },
    };
    return NextResponse.json(err, { status: 400 });
  }

  const orgId = await getCurrentOrgId();

  try {
    const convCheck = await prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: orgId },
    });
    if (!convCheck) {
      const err: PostMessagesErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      };
      return NextResponse.json(err, { status: 404 });
    }

    const message = await sendOutboundMessage({
      conversationId,
      body: messageBody.trim(),
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : undefined,
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

    const ok: PostMessagesSuccessResponse = {
      success: true,
      data: toMessageResponseDto(message),
    };
    return NextResponse.json(ok);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[POST /api/messages]', e);

    if (
      msg.includes('TWILIO_MESSAGING_SERVICE_SID') ||
      msg.includes('TWILIO_ACCOUNT_SID') ||
      msg.includes('No sender')
    ) {
      const err: PostMessagesErrorResponse = {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: msg,
        },
      };
      return NextResponse.json(err, { status: 503 });
    }

    if (msg === 'Conversation not found') {
      const err: PostMessagesErrorResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: msg },
      };
      return NextResponse.json(err, { status: 404 });
    }

    if (msg.includes('Twilio') || msg.includes('twilio') || msg.includes('21211')) {
      const err: PostMessagesErrorResponse = {
        success: false,
        error: {
          code: 'SEND_FAILED',
          message: msg,
        },
      };
      return NextResponse.json(err, { status: 502 });
    }

    const err: PostMessagesErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send message',
      },
    };
    return NextResponse.json(err, { status: 500 });
  }
}
