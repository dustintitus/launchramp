'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { ConversationList } from '@/components/inbox/ConversationList';
import { MessageThread } from '@/components/inbox/MessageThread';
import { ContactSidebar } from '@/components/crm/ContactSidebar';
import type { Activity, Conversation } from '@/types';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err?.error === 'string' ? err.error : res.statusText || 'Request failed'
    );
  }
  return res.json();
}

function buildConversationsUrl(opts: {
  assignedTo?: string;
  unassigned?: boolean;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (opts.assignedTo) q.set('assignedTo', opts.assignedTo);
  if (opts.unassigned) q.set('unassigned', 'true');
  if (opts.search?.trim()) q.set('search', opts.search.trim());
  const s = q.toString();
  return s ? `/api/conversations?${s}` : '/api/conversations';
}

type ListResponse = {
  conversations: Conversation[];
  total: number;
  unreadCount: number;
  meta?: {
    organizationId: string;
    filters: {
      assignedTo: string | null;
      unassignedOnly: boolean;
      search: string | null;
    };
  };
};

function normalizeActivities(raw: unknown): Activity[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => {
    const row = a as {
      id: string;
      type: Activity['type'];
      metadata?: unknown;
      createdAt: string;
    };
    return {
      id: row.id,
      type: row.type,
      metadata:
        row.metadata &&
        typeof row.metadata === 'object' &&
        row.metadata !== null
          ? (row.metadata as Record<string, unknown>)
          : undefined,
      createdAt:
        typeof row.createdAt === 'string'
          ? row.createdAt
          : new Date(row.createdAt).toISOString(),
    };
  });
}

export function InboxContent() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const assignedTo = searchParams.get('assignedTo') ?? undefined;
  const unassigned = searchParams.get('unassigned') === 'true';

  const listUrl = useMemo(
    () =>
      buildConversationsUrl({
        assignedTo,
        unassigned,
        search: deferredSearch,
      }),
    [assignedTo, unassigned, deferredSearch]
  );

  const {
    data: listData,
    error: listError,
    isLoading: listLoading,
    mutate: mutateList,
  } = useSWR<ListResponse>(listUrl, fetchJSON, { revalidateOnFocus: true });

  const {
    data: conversation,
    error: convError,
    isLoading: convLoading,
    mutate: mutateConversation,
  } = useSWR<Conversation | null>(
    selectedId ? `/api/conversations/${selectedId}` : null,
    fetchJSON,
    { revalidateOnFocus: true }
  );

  const contactId = conversation?.contact?.id;

  const { data: activitiesRaw } = useSWR(
    contactId ? `/api/contacts/${contactId}/activities` : null,
    fetchJSON,
    { revalidateOnFocus: true }
  );

  const activities = useMemo(
    () => normalizeActivities(activitiesRaw),
    [activitiesRaw]
  );

  useEffect(() => {
    if (selectedId && conversation) {
      void mutateList();
    }
  }, [selectedId, conversation?.id, mutateList]);

  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSendMessage = async (text: string) => {
    if (!selectedId) return;
    setSendError(null);
    setIsSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedId, text }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? 'Failed to send');
      }
      await Promise.all([mutateConversation(), mutateList()]);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setIsSending(false);
    }
  };

  const handleAddNote = (content: string) => {
    console.log('Add note:', content);
  };

  const handleUpdateStage = (stage: string) => {
    console.log('Update stage:', stage);
  };

  const conversations = listData?.conversations ?? [];
  const unreadCount = listData?.unreadCount;
  const listTotal = listData?.total ?? 0;
  const activeFilters = listData?.meta?.filters;
  const orgIdForApi = listData?.meta?.organizationId;

  const showEmptyHelp =
    !listLoading &&
    !listError &&
    listData &&
    listTotal === 0;

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex w-full flex-shrink-0 flex-col border-r border-neutral-200/80 md:w-80 lg:w-96">
        {listError && (
          <p className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {listError.message}
          </p>
        )}
        {listLoading && !listData ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
            Loading conversations…
          </div>
        ) : (
          <>
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={setSelectedId}
              search={search}
              onSearchChange={setSearch}
              unreadCount={unreadCount}
            />
            {showEmptyHelp && (
              <div className="border-t border-amber-100 bg-amber-50/90 px-4 py-3 text-xs text-amber-950">
                <p className="font-medium">No conversations match this view.</p>
                {activeFilters?.assignedTo === 'me' && (
                  <p className="mt-2 text-amber-900/90">
                    Inbox → <strong>Assigned to me</strong> only shows threads assigned to your
                    user. SMS webhooks usually create <strong>unassigned</strong> threads — open{' '}
                    <strong>All</strong> or <strong>Unassigned</strong> in the left sidebar.
                  </p>
                )}
                {activeFilters?.unassignedOnly && (
                  <p className="mt-2 text-amber-900/90">
                    <strong>Unassigned</strong> is on; if nothing appears, try <strong>All</strong>{' '}
                    or confirm the conversation has no assignee in the database.
                  </p>
                )}
                {!activeFilters?.assignedTo && !activeFilters?.unassignedOnly && (
                  <p className="mt-2 text-amber-900/90">
                    API reports <strong>0</strong> conversations for organization{' '}
                    <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[11px]">
                      {orgIdForApi ?? '(unknown)'}
                    </code>
                    . Confirm{' '}
                    <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[11px]">
                      NEXT_PUBLIC_ORG_ID
                    </code>{' '}
                    on Vercel matches{' '}
                    <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[11px]">
                      TWILIO_DEFAULT_ORG_ID
                    </code>{' '}
                    (e.g. both <code className="font-mono text-[11px]">org_launchramp_demo</code>), run{' '}
                    <code className="font-mono text-[11px]">npm run db:seed</code> against production, or
                    check Twilio inbound logs if SMS never created rows.
                  </p>
                )}
                {activeFilters?.search && (
                  <p className="mt-2 text-amber-900/90">
                    Search is active; clear the search box to see all conversations.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {sendError && (
          <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {sendError}
          </p>
        )}
        {convError && selectedId && (
          <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {convError.message}
          </p>
        )}
        <MessageThread
          conversation={conversation ?? null}
          isLoading={Boolean(selectedId && convLoading && !conversation)}
          onSendMessage={handleSendMessage}
          isSending={isSending}
        />
      </div>
      <div className="hidden flex-shrink-0 lg:block">
        <ContactSidebar
          contact={conversation?.contact ?? null}
          activities={activities}
          onAddNote={handleAddNote}
          onUpdateStage={handleUpdateStage}
          isLoading={Boolean(selectedId && convLoading && !conversation)}
        />
      </div>
    </div>
  );
}
