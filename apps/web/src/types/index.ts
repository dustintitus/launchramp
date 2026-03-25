/**
 * Core type definitions for the inbox + CRM app.
 * Shared between mock data and API responses.
 */

export type LifecycleStage = 'lead' | 'qualified' | 'customer' | 'churned';

export type ChannelType = 'sms' | 'mms' | 'rcs' | 'apple_mfb';

export type MessageDirection = 'inbound' | 'outbound';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed';

export type ActivityType =
  | 'message_sent'
  | 'message_received'
  | 'note_added'
  | 'stage_changed'
  | 'owner_changed'
  | 'tag_added'
  | 'tag_removed';

export interface Contact {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  stage: LifecycleStage;
  ownerId: string | null;
  tags: string[];
  owner?: { id: string; name: string | null } | null;
}

export interface Message {
  id: string;
  body: string;
  direction: MessageDirection;
  status: MessageStatus;
  createdAt: string;
  mediaUrls?: string[];
}

export interface Conversation {
  id: string;
  contact: Contact;
  assignedTo: { id: string; name: string | null } | null;
  isUnread: boolean;
  lastMessageAt: string;
  channelType: ChannelType;
  messages?: Message[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface InboxStats {
  total: number;
  unread: number;
  unassigned: number;
}
