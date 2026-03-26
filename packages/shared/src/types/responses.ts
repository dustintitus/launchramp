import type { ChannelType, MessageDirection, MessageStatus } from './enums';

export type MessageResponseDto = {
  id: string;
  conversationId: string;
  body: string;
  direction: MessageDirection;
  channelType: ChannelType;
  status: MessageStatus;
  providerMessageId: string | null;
  mediaUrls: string[];
  createdAt: string;
};

export type PostMessagesSuccessResponse = {
  success: true;
  data: MessageResponseDto;
};

export type PostMessagesErrorResponse = {
  success: false;
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'NOT_FOUND'
      | 'CONFIG_ERROR'
      | 'SEND_FAILED'
      | 'INTERNAL_ERROR';
    message: string;
  };
};

export type TwilioInboundWebhookSuccessResponse = {
  success: true;
  data: {
    received: true;
    /** Present when the inbound number matched a `ChannelAccount` */
    messageId?: string;
    conversationId?: string;
    contactId?: string;
  };
};

export type TwilioStatusWebhookSuccessResponse = {
  success: true;
  data: {
    received: true;
    updated: number;
  };
};

export type TwilioWebhookErrorResponse = {
  success: false;
  error: {
    code: 'INVALID_SIGNATURE' | 'PROCESSING_ERROR';
    message: string;
  };
};
