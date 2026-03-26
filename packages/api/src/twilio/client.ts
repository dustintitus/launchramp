import Twilio from 'twilio';

let cached: ReturnType<typeof Twilio> | null = null;

/**
 * Singleton Twilio REST client (Account SID + Auth Token).
 */
export function getTwilioClient(): ReturnType<typeof Twilio> {
  if (cached) return cached;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
  }

  cached = Twilio(accountSid, authToken);
  return cached;
}
