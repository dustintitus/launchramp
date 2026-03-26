import { NextResponse } from 'next/server';

const XML_UTF8 = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

/**
 * Inbound SMS webhooks must respond with TwiML (XML). JSON is not valid here.
 * @see https://www.twilio.com/docs/messaging/twiml
 */
export function twilioInboundAck(): NextResponse {
  return new NextResponse(XML_UTF8, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Status callbacks only need a quick 200; Twilio accepts plain text with explicit Content-Type.
 */
export function twilioStatusAck(): NextResponse {
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function twilioPlainError(
  status: 403 | 500,
  body: string
): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
