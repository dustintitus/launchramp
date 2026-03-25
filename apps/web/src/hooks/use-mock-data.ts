'use client';

/**
 * Mock data for development when API/DB not available.
 * Swap useConversations/useConversation with this for static UI development.
 */
import type { Conversation, Contact, Message } from '@/features/inbox/types';

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    contact: {
      id: 'c1',
      name: 'Sarah Chen',
      phone: '+15551234567',
      email: 'sarah@example.com',
      stage: 'qualified',
      ownerId: 'u1',
      tags: ['vip'],
      owner: { id: 'u1', name: 'Alex' },
    },
    assignedTo: { id: 'u1', name: 'Alex' },
    isUnread: true,
    lastMessageAt: new Date().toISOString(),
    channelType: 'sms',
    messages: [
      {
        id: 'm1',
        body: 'Hi! I saw your ad and I\'m interested in the 2024 Honda Accord.',
        direction: 'inbound',
        status: 'delivered',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'm2',
        body: 'Hi Sarah! Thanks for reaching out. I\'d be happy to help. When would you like to come in for a test drive?',
        direction: 'outbound',
        status: 'delivered',
        createdAt: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
  },
  {
    id: 'conv_2',
    contact: {
      id: 'c2',
      name: 'Mike Rodriguez',
      phone: '+15559876543',
      email: null,
      stage: 'lead',
      ownerId: null,
      tags: [],
      owner: null,
    },
    assignedTo: null,
    isUnread: true,
    lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
    channelType: 'sms',
  },
];

export const MOCK_ACTIVITIES = [
  { id: 'a1', type: 'message_received', createdAt: new Date().toISOString(), metadata: {} },
  { id: 'a2', type: 'message_sent', createdAt: new Date(Date.now() - 3600000).toISOString(), metadata: {} },
  { id: 'a3', type: 'note_added', createdAt: new Date(Date.now() - 86400000).toISOString(), metadata: { content: 'Interested in Accord. Follow up tomorrow.' } },
  { id: 'a4', type: 'stage_changed', createdAt: new Date(Date.now() - 172800000).toISOString(), metadata: { from: 'lead', to: 'qualified' } },
];
