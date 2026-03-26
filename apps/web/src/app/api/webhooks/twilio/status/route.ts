import { NextResponse } from 'next/server';
import {
  createTwilioProvider,
  updateMessageStatus,
  parseTwilioWebhookParams,
  resolveTwilioWebhookUrl,
  validateTwilioSignature,
} from '@launchramp/api';
import type {
  TwilioStatusWebhookSuccessResponse,
  TwilioWebhookErrorResponse,
} from '@launchramp/shared';
import { logWebhookError } from '@/lib/webhook-error-log';

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
    const parsed = provider.parseStatusWebhook(params);

    const result = await updateMessageStatus(
      parsed.providerMessageId,
      parsed.status
    );

    const ok: TwilioStatusWebhookSuccessResponse = {
      success: true,
      data: {
        received: true,
        updated: result.count,
      },
    };
    return NextResponse.json(ok);
  } catch (error) {
    logWebhookError('webhook/twilio/status', error);
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
