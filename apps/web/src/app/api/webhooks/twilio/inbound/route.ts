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
import { logWebhookError } from '@/lib/webhook-error-log';
import {
  twilioInboundAck,
  twilioPlainError,
} from '@/lib/twilio-webhook-response';

export const runtime = 'nodejs';

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
    return twilioPlainError(403, 'Invalid Twilio signature');
  }

  try {
    const provider = createTwilioProvider();
    const parsed = provider.parseInboundWebhook(params);

    if (!parsed.from?.trim() || !parsed.to?.trim()) {
      console.warn('[webhook/twilio/inbound] Missing From or To', {
        from: parsed.from,
        to: parsed.to,
      });
      return twilioInboundAck();
    }

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
      return twilioInboundAck();
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

    console.log('[webhook/twilio/inbound] ok', {
      messageId: message.id,
      conversationId: conversation.id,
      contactId: contact.id,
    });

    return twilioInboundAck();
  } catch (error) {
    logWebhookError('webhook/twilio/inbound', error);
    return twilioPlainError(500, 'Webhook processing failed');
  }
}
