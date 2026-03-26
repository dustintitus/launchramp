import {
  createTwilioProvider,
  updateMessageStatus,
  parseTwilioWebhookParams,
  resolveTwilioWebhookUrl,
  validateTwilioSignature,
} from '@launchramp/api';
import { logWebhookError } from '@/lib/webhook-error-log';
import {
  twilioPlainError,
  twilioStatusAck,
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
    const parsed = provider.parseStatusWebhook(params);

    const result = await updateMessageStatus(
      parsed.providerMessageId,
      parsed.status
    );

    console.log('[webhook/twilio/status] ok', {
      providerMessageId: parsed.providerMessageId,
      status: parsed.status,
      updated: result.count,
    });

    return twilioStatusAck();
  } catch (error) {
    logWebhookError('webhook/twilio/status', error);
    return twilioPlainError(500, 'Webhook processing failed');
  }
}
