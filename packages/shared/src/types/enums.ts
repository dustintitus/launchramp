export type ChannelType = 'sms' | 'mms' | 'rcs' | 'apple_mfb';

export type MessageDirection = 'inbound' | 'outbound';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed';

export type LifecycleStage = 'lead' | 'qualified' | 'customer' | 'churned';

export type ActivityType =
  | 'message_sent'
  | 'message_received'
  | 'note_added'
  | 'stage_changed'
  | 'owner_changed'
  | 'tag_added'
  | 'tag_removed';

export type ConsentType = 'opt_in' | 'opt_out';
