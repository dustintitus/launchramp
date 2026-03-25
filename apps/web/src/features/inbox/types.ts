export interface Contact {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  stage: 'lead' | 'qualified' | 'customer' | 'churned';
  ownerId: string | null;
  tags: string[];
  owner?: { id: string; name: string | null } | null;
}

export interface Message {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: string;
  createdAt: string;
  mediaUrls?: string[];
}

export interface Conversation {
  id: string;
  contact: Contact;
  assignedTo: { id: string; name: string | null } | null;
  isUnread: boolean;
  lastMessageAt: string;
  channelType: string;
  messages?: Message[];
}

export interface Activity {
  id: string;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
