import type {
  MessagingProvider,
  SendMessageParams,
  SendMessageResult,
  InboundWebhookResult,
  StatusWebhookResult,
} from '@launchramp/shared';
import type { MessageStatus } from '@prisma/client';
import { getTwilioClient } from '../twilio/client';
import { sendSms } from '../services/sms-service';

/** Align with sms-service: Twilio `queued` means accepted, map to `sent` for UI. */
const TWILIO_STATUS_MAP: Record<string, MessageStatus> = {
  accepted: 'sent',
  queued: 'sent',
  sending: 'sent',
  sent: 'sent',
  delivered: 'delivered',
  failed: 'failed',
  undelivered: 'failed',
};

export function createTwilioProvider(): MessagingProvider {
  return {
    async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

      if (messagingServiceSid) {
        return sendSms({
          to: params.to,
          body: params.body,
          mediaUrls: params.mediaUrls,
        });
      }

      const client = getTwilioClient();

      if (!params.from) {
        throw new Error('No sender: set TWILIO_MESSAGING_SERVICE_SID or configure a From number on the channel account');
      }

      const message = await client.messages.create({
        to: params.to,
        body: params.body,
        from: params.from,
        ...(params.mediaUrls?.length ? { mediaUrl: params.mediaUrls } : {}),
      });

      const raw = message.status ?? 'sent';
      return {
        providerMessageId: message.sid,
        status: (TWILIO_STATUS_MAP[raw] ?? 'sent') as MessageStatus,
      };
    },

    parseInboundWebhook(payload: unknown): InboundWebhookResult {
      const p = payload as Record<string, string | undefined>;
      const from = p.From ?? p.from ?? '';
      const to = p.To ?? p.to ?? '';
      const body = p.Body ?? p.body ?? p.MessageBody ?? '';
      const sid = p.MessageSid ?? p.SmsSid ?? '';

      const numMedia = parseInt(p.NumMedia ?? '0', 10);
      const mediaUrls =
        numMedia > 0
          ? [...Array(numMedia)]
              .map((_, i) => p[`MediaUrl${i}`] ?? '')
              .filter(Boolean)
          : undefined;

      return {
        from,
        to,
        body,
        providerMessageId: sid,
        mediaUrls,
      };
    },

    parseStatusWebhook(payload: unknown): StatusWebhookResult {
      const p = payload as Record<string, string>;
      const sid = p.MessageSid ?? p.SmsSid ?? '';
      const status = p.MessageStatus ?? p.SmsStatus ?? 'sent';

      return {
        providerMessageId: sid,
        status: (TWILIO_STATUS_MAP[status] ?? 'sent') as MessageStatus,
      };
    },
  };
}
