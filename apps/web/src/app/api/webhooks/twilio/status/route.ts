import { NextResponse } from 'next/server';
import { createTwilioProvider } from '@launchramp/api';
import { updateMessageStatus } from '@launchramp/api';
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
    const parsed = provider.parseStatusWebhook(payload);

    await updateMessageStatus(parsed.externalId, parsed.status);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook/twilio/status]', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
