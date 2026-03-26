import { NextResponse } from 'next/server';
import {
  createTwilioProvider,
  findOrCreateConversation,
  createMessage,
  createActivity,
  upsertContactByPhone,
  parseTwilioWebhookParams,
  resolveTwilioWebhookUrl,
  validateTwilioSignature,
} from '@launchramp/api';
import { prisma } from '@launchramp/db';
import type {
  TwilioInboundWebhookSuccessResponse,
  TwilioWebhookErrorResponse,
} from '@launchramp/shared';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get('x-twilio-signature') ??
    request.headers.get('X-Twilio-Signature') ??
    '';

  const params = parseTwilioWebhookParams(rawBody);
  const url = resolveTwilioWebhookUrl(request);
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (
    process.env.NODE_ENV === 'production' &&
    !validateTwilioSignature(authToken, signature, url, params)
  ) {
    const err: TwilioWebhookErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Invalid or missing Twilio signature',
      },
    };
    return NextResponse.json(err, { status: 403 });
  }

  try {
    const provider = createTwilioProvider();
    const parsed = provider.parseInboundWebhook(params);

    const orgId = process.env.TWILIO_DEFAULT_ORG_ID ?? 'org_launchramp_demo';

    const channelAccount = await prisma.channelAccount.findFirst({
      where: {
        organizationId: orgId,
        channelType: 'sms',
        OR: [{ phoneNumber: parsed.to }, { externalId: parsed.to }],
      },
    });

    if (!channelAccount) {
      console.warn('[webhook] No channel account found for', parsed.to);
      const ok: TwilioInboundWebhookSuccessResponse = {
        success: true,
        data: { received: true },
      };
      return NextResponse.json(ok);
    }

    const contact = await upsertContactByPhone({
      organizationId: orgId,
      phone: parsed.from,
      name: undefined,
    });

    const conversation = await findOrCreateConversation({
      organizationId: orgId,
      contactId: contact.id,
      channelAccountId: channelAccount.id,
      channelType: 'sms',
    });

    const message = await createMessage({
      conversationId: conversation.id,
      body: parsed.body,
      direction: 'inbound',
      channelType: 'sms',
      providerMessageId: parsed.providerMessageId || undefined,
      mediaUrls: parsed.mediaUrls,
      status: 'delivered',
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        isUnread: true,
      },
    });

    await createActivity({
      organizationId: orgId,
      contactId: contact.id,
      type: 'message_received',
      messageId: message.id,
    });

    const ok: TwilioInboundWebhookSuccessResponse = {
      success: true,
      data: {
        received: true,
        messageId: message.id,
        conversationId: conversation.id,
        contactId: contact.id,
      },
    };
    return NextResponse.json(ok);
  } catch (error) {
    console.error('[webhook/twilio/inbound]', error);
    const err: TwilioWebhookErrorResponse = {
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Webhook processing failed',
      },
    };
    return NextResponse.json(err, { status: 500 });
  }
}
