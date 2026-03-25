'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPhone, formatRelativeTime } from '@/lib/utils';
import type { Contact, Activity } from '@/features/inbox/types';
import { cn } from '@/lib/utils';

const stageVariant: Record<string, 'lead' | 'qualified' | 'customer' | 'churned'> = {
  lead: 'lead',
  qualified: 'qualified',
  customer: 'customer',
  churned: 'churned',
};

interface ContactSidebarProps {
  contact: Contact | null;
  activities: Activity[];
  onAddNote?: (content: string) => void;
  onUpdateStage?: (stage: string) => void;
  onAssign?: (userId: string | null) => void;
  isLoading?: boolean;
}

export function ContactSidebar({
  contact,
  activities,
  onAddNote,
  onUpdateStage,
  onAssign,
  isLoading,
}: ContactSidebarProps) {
  const [noteInput, setNoteInput] = useState('');

  if (isLoading || !contact) {
    return (
      <div className="flex w-80 flex-col border-l border-neutral-200 bg-white">
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-neutral-500">
          {isLoading ? 'Loading...' : 'Select a conversation'}
        </div>
      </div>
    );
  }

  const displayName = contact.name ?? formatPhone(contact.phone);

  const handleAddNote = () => {
    const content = noteInput.trim();
    if (content && onAddNote) {
      onAddNote(content);
      setNoteInput('');
    }
  };

  return (
    <div className="flex w-80 flex-shrink-0 flex-col border-l border-neutral-200 bg-white">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Contact header */}
          <div className="flex flex-col items-center gap-3 pb-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-semibold text-neutral-900">{displayName}</h3>
              <p className="text-sm text-neutral-500">{contact.phone}</p>
              {contact.email && (
                <p className="text-sm text-neutral-500">{contact.email}</p>
              )}
            </div>
            <Badge variant={stageVariant[contact.stage] ?? 'secondary'}>
              {contact.stage}
            </Badge>
          </div>

          {/* Quick actions */}
          <div className="space-y-2 border-t border-neutral-100 py-4">
            <p className="text-xs font-medium uppercase text-neutral-400">
              Stage
            </p>
            <div className="flex flex-wrap gap-1">
              {['lead', 'qualified', 'customer', 'churned'].map((stage) => (
                <Button
                  key={stage}
                  variant={contact.stage === stage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateStage?.(stage)}
                  className="text-xs"
                >
                  {stage}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {contact.tags?.length > 0 && (
            <div className="border-t border-neutral-100 py-4">
              <p className="mb-2 text-xs font-medium uppercase text-neutral-400">
                Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add note */}
          <div className="border-t border-neutral-100 py-4">
            <p className="mb-2 text-xs font-medium uppercase text-neutral-400">
              Add note
            </p>
            <Textarea
              placeholder="Add a note..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <Button
              size="sm"
              className="mt-2 w-full"
              onClick={handleAddNote}
              disabled={!noteInput.trim()}
            >
              Add note
            </Button>
          </div>

          {/* Activity feed */}
          <div className="border-t border-neutral-100 py-4">
            <p className="mb-3 text-xs font-medium uppercase text-neutral-400">
              Activity
            </p>
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-neutral-500">No activity yet</p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const label = activity.type.replace(/_/g, ' ');
  const content =
    activity.metadata?.content ??
    (activity.metadata?.from && activity.metadata?.to
      ? `${activity.metadata.from} → ${activity.metadata.to}`
      : null);

  return (
    <div className="rounded-xl bg-neutral-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium capitalize text-neutral-700">
          {label}
        </span>
        <span className="text-[10px] text-neutral-400">
          {formatRelativeTime(activity.createdAt)}
        </span>
      </div>
      {content && (
        <p className="mt-1 text-sm text-neutral-600">{String(content)}</p>
      )}
    </div>
  );
}
