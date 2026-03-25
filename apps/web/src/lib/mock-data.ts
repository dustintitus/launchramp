/**
 * Mock data for development and UI preview.
 * Replace with API hooks when integrating backend.
 */

import type { Conversation, Contact, Message, Activity, InboxStats } from '@/types';

const now = new Date();
const minutesAgo = (n: number) => new Date(now.getTime() - n * 60000).toISOString();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000).toISOString();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const mockContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Sarah Chen',
    phone: '+15551234567',
    email: 'sarah@example.com',
    stage: 'qualified',
    ownerId: 'u1',
    tags: ['vip', 'accord'],
    owner: { id: 'u1', name: 'Alex Johnson' },
  },
  {
    id: 'c2',
    name: 'Mike Rodriguez',
    phone: '+15559876543',
    email: null,
    stage: 'lead',
    ownerId: null,
    tags: [],
    owner: null,
  },
  {
    id: 'c3',
    name: 'Emma Wilson',
    phone: '+15555555555',
    email: 'emma@example.com',
    stage: 'customer',
    ownerId: 'u1',
    tags: ['repeat'],
    owner: { id: 'u1', name: 'Alex Johnson' },
  },
  {
    id: 'c4',
    name: 'James Lee',
    phone: '+15552223333',
    email: null,
    stage: 'lead',
    ownerId: null,
    tags: ['test-drive'],
    owner: null,
  },
  {
    id: 'c5',
    name: 'Lisa Park',
    phone: '+15554445566',
    email: 'lisa@example.com',
    stage: 'qualified',
    ownerId: 'u2',
    tags: [],
    owner: { id: 'u2', name: 'Jamie Smith' },
  },
];

const mockMessages: Record<string, Message[]> = {
  conv_1: [
    {
      id: 'm1',
      body: "Hi! I saw your ad and I'm interested in the 2024 Honda Accord. Do you have availability for a test drive this week?",
      direction: 'inbound',
      status: 'delivered',
      createdAt: hoursAgo(2),
    },
    {
      id: 'm2',
      body: "Hi Sarah! Thanks for reaching out. We'd be happy to help. We have openings Thursday and Friday. Which works better for you?",
      direction: 'outbound',
      status: 'delivered',
      createdAt: hoursAgo(1.5),
    },
    {
      id: 'm3',
      body: 'Thursday afternoon would be perfect. Around 2pm?',
      direction: 'inbound',
      status: 'delivered',
      createdAt: hoursAgo(1),
    },
    {
      id: 'm4',
      body: 'Perfect! I\'ll have a 2024 Accord ready for you at 2pm Thursday. See you then!',
      direction: 'outbound',
      status: 'delivered',
      createdAt: minutesAgo(45),
    },
  ],
  conv_2: [
    {
      id: 'm5',
      body: "Hey, I'm looking for info on your financing options. What rates do you offer?",
      direction: 'inbound',
      status: 'delivered',
      createdAt: hoursAgo(5),
    },
  ],
  conv_3: [
    {
      id: 'm6',
      body: 'Thanks again for the great experience! The Accord is running beautifully.',
      direction: 'inbound',
      status: 'delivered',
      createdAt: daysAgo(2),
    },
  ],
};

export const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    contact: mockContacts[0],
    assignedTo: { id: 'u1', name: 'Alex Johnson' },
    isUnread: true,
    lastMessageAt: minutesAgo(45),
    channelType: 'sms',
    messages: mockMessages.conv_1,
  },
  {
    id: 'conv_2',
    contact: mockContacts[1],
    assignedTo: null,
    isUnread: true,
    lastMessageAt: hoursAgo(5),
    channelType: 'sms',
    messages: mockMessages.conv_2,
  },
  {
    id: 'conv_3',
    contact: mockContacts[2],
    assignedTo: { id: 'u1', name: 'Alex Johnson' },
    isUnread: false,
    lastMessageAt: daysAgo(2),
    channelType: 'sms',
    messages: mockMessages.conv_3,
  },
  {
    id: 'conv_4',
    contact: mockContacts[3],
    assignedTo: null,
    isUnread: false,
    lastMessageAt: daysAgo(3),
    channelType: 'sms',
  },
  {
    id: 'conv_5',
    contact: mockContacts[4],
    assignedTo: { id: 'u2', name: 'Jamie Smith' },
    isUnread: false,
    lastMessageAt: daysAgo(5),
    channelType: 'sms',
  },
];

export const mockActivities: Record<string, Activity[]> = {
  c1: [
    { id: 'a1', type: 'message_received', createdAt: hoursAgo(2), metadata: {} },
    { id: 'a2', type: 'message_sent', createdAt: hoursAgo(1.5), metadata: {} },
    {
      id: 'a3',
      type: 'note_added',
      createdAt: daysAgo(1),
      metadata: { content: 'Interested in Accord. Scheduled test drive Thursday 2pm.' },
    },
    {
      id: 'a4',
      type: 'stage_changed',
      createdAt: daysAgo(2),
      metadata: { from: 'lead', to: 'qualified' },
    },
  ],
  c2: [
    { id: 'a5', type: 'message_received', createdAt: hoursAgo(5), metadata: {} },
  ],
  c3: [
    { id: 'a6', type: 'message_received', createdAt: daysAgo(2), metadata: {} },
    {
      id: 'a7',
      type: 'note_added',
      createdAt: daysAgo(3),
      metadata: { content: 'Happy customer. Sent follow-up survey.' },
    },
  ],
};

export const mockStats: InboxStats = {
  total: 5,
  unread: 2,
  unassigned: 2,
};

/** Get activities for a contact (for API swap) */
export function getMockActivities(contactId: string): Activity[] {
  return mockActivities[contactId] ?? [];
}

/** Get full conversation with messages (for API swap) */
export function getMockConversation(id: string): Conversation | null {
  return mockConversations.find((c) => c.id === id) ?? null;
}

/** Get filtered conversation list (for API swap) */
export function getMockConversations(filters?: {
  assignedTo?: string;
  unassigned?: boolean;
  search?: string;
}): Conversation[] {
  let list = [...mockConversations];

  if (filters?.unassigned) {
    list = list.filter((c) => !c.assignedTo);
  }
  if (filters?.assignedTo) {
    list = list.filter((c) => c.assignedTo?.id === filters.assignedTo);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.contact.name?.toLowerCase().includes(q) ||
        c.contact.phone.includes(q) ||
        c.contact.email?.toLowerCase().includes(q)
    );
  }

  return list;
}
