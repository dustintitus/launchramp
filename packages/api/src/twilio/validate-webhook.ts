import twilio from 'twilio';

/**
 * Resolves the URL Twilio used when signing the request.
 * Set `TWILIO_WEBHOOK_BASE_URL` (e.g. https://yourdomain.com) if it differs from `request.url` (proxies, previews).
 */
export function resolveTwilioWebhookUrl(request: Request): string {
  const base = process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/$/, '');
  const { pathname, search } = new URL(request.url);
  if (base) return `${base}${pathname}${search}`;
  return request.url;
}

/**
 * Parse Twilio webhook body (typically `application/x-www-form-urlencoded`) into a flat string map for signature validation.
 */
export function parseTwilioWebhookParams(rawBody: string): Record<string, string> {
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [
          k,
          v === undefined || v === null ? '' : String(v),
        ])
      );
    }
  } catch {
    /* Twilio sends form bodies */
  }
  return Object.fromEntries(new URLSearchParams(rawBody).entries());
}

/**
 * Validates `X-Twilio-Signature` using Twilio's algorithm (timing-safe compare).
 */
export function validateTwilioSignature(
  authToken: string | undefined,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken) return false;
  return twilio.validateRequest(authToken, signature || '', url, params);
}
