export const CHANNEL_TYPES = ['sms', 'mms', 'rcs', 'apple_mfb'] as const;

export const MESSAGE_DIRECTIONS = ['inbound', 'outbound'] as const;

export const MESSAGE_STATUSES = ['queued', 'sent', 'delivered', 'failed'] as const;

export const LIFECYCLE_STAGES = [
  'lead',
  'qualified',
  'customer',
  'churned',
] as const;

export const ACTIVITY_TYPES = [
  'message_sent',
  'message_received',
  'note_added',
  'stage_changed',
  'owner_changed',
  'tag_added',
  'tag_removed',
] as const;
