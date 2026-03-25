'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPhone, formatRelativeTime, cn } from '@/lib/utils';
import type { Contact, Activity } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export interface ContactSidebarProps {
  contact: Contact | null;
  activities: Activity[];
  onAddNote?: (content: string) => void;
  onUpdateStage?: (stage: string) => void;
  onAssign?: (userId: string | null) => void;
  isLoading?: boolean;
  className?: string;
}

const stageVariant: Record<string, 'lead' | 'qualified' | 'customer' | 'churned'> = {
  lead: 'lead',
  qualified: 'qualified',
  customer: 'customer',
  churned: 'churned',
};

const LIFECYCLE_STAGES = ['lead', 'qualified', 'customer', 'churned'] as const;

function ActivityItem({ activity }: { activity: Activity }) {
  const label = activity.type.replace(/_/g, ' ');
  const content =
    activity.metadata?.content ??
    (activity.metadata?.from && activity.metadata?.to
      ? `${activity.metadata.from} → ${activity.metadata.to}`
      : null);

  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium capitalize text-neutral-700">
          {label}
        </span>
        <span className="text-[11px] text-neutral-400 tabular-nums">
          {formatRelativeTime(activity.createdAt)}
        </span>
      </div>
      {content && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">
          {String(content)}
        </p>
      )}
    </div>
  );
}

export function ContactSidebar({
  contact,
  activities,
  onAddNote,
  onUpdateStage,
  isLoading,
  className,
}: ContactSidebarProps) {
  const [noteInput, setNoteInput] = useState('');

  if (isLoading || !contact) {
    return (
      <div
        className={cn(
          'flex w-full flex-col border-l border-neutral-200/80 bg-white md:w-80 lg:w-[320px]',
          className
        )}
      >
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <Skeleton className="mb-4 h-16 w-16 rounded-full" />
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <p className="mt-6 text-sm text-neutral-500">
            {isLoading ? 'Loading...' : 'Select a conversation'}
          </p>
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
    <div
      className={cn(
        'flex w-full flex-col border-l border-neutral-200/80 bg-white md:w-80 lg:w-[320px]',
        className
      )}
    >
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Contact header */}
          <div className="flex flex-col items-center gap-3 pb-5">
            <Avatar className="h-16 w-16 shrink-0 ring-2 ring-neutral-100">
              <AvatarFallback className="bg-neutral-100 text-lg font-semibold text-neutral-600">
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
            <Badge
              variant={stageVariant[contact.stage] ?? 'secondary'}
              className="text-xs"
            >
              {contact.stage}
            </Badge>
          </div>

          {/* Stage actions */}
          <div className="space-y-2 border-t border-neutral-100 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Lifecycle stage
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LIFECYCLE_STAGES.map((stage) => (
                <Button
                  key={stage}
                  variant={contact.stage === stage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateStage?.(stage)}
                  className="h-7 text-xs"
                >
                  {stage}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {contact.tags?.length > 0 && (
            <div className="border-t border-neutral-100 py-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add note */}
          <div className="border-t border-neutral-100 py-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Add note
            </p>
            <Textarea
              placeholder="Add a note to this contact..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
            />
            <Button
              size="sm"
              className="mt-2.5 w-full"
              onClick={handleAddNote}
              disabled={!noteInput.trim()}
            >
              Add note
            </Button>
          </div>

          {/* Activity feed */}
          <div className="border-t border-neutral-100 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Activity
            </p>
            <div className="space-y-2.5">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
              {activities.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-500">
                  No activity yet
                </p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
