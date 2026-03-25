'use client';

import { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime, formatPhone } from '@/lib/utils';
import type { Conversation, Message } from '@/features/inbox/types';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
  conversation: Conversation | null;
  isLoading?: boolean;
  onSendMessage: (text: string) => void;
  isSending?: boolean;
}

export function MessageThread({
  conversation,
  isLoading,
  onSendMessage,
  isSending,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const messages = conversation?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading || !conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-sm text-neutral-500">
            {isLoading ? 'Loading...' : 'Select a conversation'}
          </p>
        </div>
      </div>
    );
  }

  const displayName = conversation.contact.name ?? formatPhone(conversation.contact.phone);

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-neutral-900">{displayName}</h2>
            <p className="text-xs text-neutral-500">{conversation.contact.phone}</p>
          </div>
        </div>
        <div className="text-xs text-neutral-400">
          {conversation.assignedTo
            ? `Assigned to ${conversation.assignedTo.name}`
            : 'Unassigned'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-neutral-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = input.trim();
            if (text && !isSending) {
              onSendMessage(text);
              setInput('');
            }
          }}
          className="flex gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = input.trim();
                if (text && !isSending) {
                  onSendMessage(text);
                  setInput('');
                }
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="self-end rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound';

  return (
    <div
      className={cn(
        'flex',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isOutbound
            ? 'bg-neutral-900 text-white'
            : 'bg-neutral-100 text-neutral-900'
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.body}</p>
        <p
          className={cn(
            'mt-1 text-[10px]',
            isOutbound ? 'text-neutral-300' : 'text-neutral-500'
          )}
        >
          {formatRelativeTime(message.createdAt)}
          {message.status && ` · ${message.status}`}
        </p>
      </div>
    </div>
  );
}

