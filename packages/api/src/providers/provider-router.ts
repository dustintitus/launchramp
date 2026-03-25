import type { ChannelType } from '@launchramp/shared';
import type { MessagingProvider } from './messaging-provider';
import { createTwilioProvider } from './twilio-provider';

let twilioProvider: MessagingProvider | null = null;

function getTwilioProvider(): MessagingProvider {
  if (!twilioProvider) {
    twilioProvider = createTwilioProvider();
  }
  return twilioProvider;
}

/**
 * Routes to the appropriate messaging provider based on channel type.
 * Extensible for Apple MFB (Infobip), RCS, etc.
 */
export function getProvider(channelType: ChannelType): MessagingProvider {
  switch (channelType) {
    case 'sms':
    case 'mms':
      return getTwilioProvider();
    case 'rcs':
    case 'apple_mfb':
      throw new Error(`Channel ${channelType} not yet implemented`);
    default:
      throw new Error(`Unknown channel type: ${channelType}`);
  }
}
