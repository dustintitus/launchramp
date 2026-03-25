import { NextResponse } from 'next/server';
import { createTwilioProvider } from '@launchramp/api';
import {
  findOrCreateContact,
  findOrCreateConversation,
  createMessage,
  createActivity,
} from '@launchramp/api';
import { prisma } from '@launchramp/db';
import crypto from 'crypto';

function verifyTwilioSignature(
  body: string,
  signature: string,
  url: string
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const expected = crypto
    .createHmac('sha1', authToken)
    .update(url + body)
    .digest('base64');

  return signature === expected;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get('x-twilio-signature') ??
    request.headers.get('X-Twilio-Signature') ??
    '';

  const url = request.url;
  if (
    process.env.NODE_ENV === 'production' &&
    !verifyTwilioSignature(rawBody, signature, url)
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    const params = new URLSearchParams(rawBody);
    payload = Object.fromEntries(params.entries());
  }

  try {
    const provider = createTwilioProvider();
    const parsed = provider.parseInboundWebhook(payload);

    const orgId = process.env.TWILIO_DEFAULT_ORG_ID ?? 'org_launchramp_demo';

    const channelAccount = await prisma.channelAccount.findFirst({
      where: {
        organizationId: orgId,
        channelType: 'sms',
        OR: [
          { phoneNumber: parsed.to },
          { externalId: parsed.to },
        ],
      },
    });

    if (!channelAccount) {
      console.warn('[webhook] No channel account found for', parsed.to);
      return NextResponse.json({ received: true });
    }

    const contact = await findOrCreateContact({
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
      externalId: parsed.externalId,
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook/twilio/inbound]', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
