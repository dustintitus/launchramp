import type {
  MessagingProvider,
  SendMessageParams,
  SendMessageResult,
  InboundWebhookResult,
  StatusWebhookResult,
} from '@launchramp/shared';

/**
 * Abstract interface for messaging providers (Twilio, Infobip, etc.)
 * Do NOT tightly couple to any specific provider.
 */
export type { MessagingProvider, SendMessageParams, SendMessageResult, InboundWebhookResult, StatusWebhookResult };
