import type { MessageStatus } from '@prisma/client';
import { getTwilioClient } from '../twilio/client';

/**
 * Twilio's REST API often returns `queued` immediately after create even though the
 * message was accepted. We store `sent` so the inbox shows a sensible state; webhooks
 * still advance to `delivered` / `failed`.
 */
const TWILIO_STATUS_MAP: Record<string, MessageStatus> = {
  accepted: 'sent',
  queued: 'sent',
  sending: 'sent',
  sent: 'sent',
  delivered: 'delivered',
  failed: 'failed',
  undelivered: 'failed',
};

export type SendSmsParams = {
  to: string;
  body: string;
  mediaUrls?: string[];
};

export type SendSmsResult = {
  providerMessageId: string;
  status: MessageStatus;
};

/**
 * Sends outbound SMS/MMS via Twilio using `TWILIO_MESSAGING_SERVICE_SID`.
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!messagingServiceSid) {
    throw new Error('TWILIO_MESSAGING_SERVICE_SID is required to send SMS');
  }

  const client = getTwilioClient();

  const message = await client.messages.create({
    to: params.to,
    body: params.body,
    messagingServiceSid,
    ...(params.mediaUrls?.length ? { mediaUrl: params.mediaUrls } : {}),
  });

  const raw = message.status ?? 'sent';
  const status = TWILIO_STATUS_MAP[raw] ?? 'sent';

  return {
    providerMessageId: message.sid,
    status,
  };
}
