'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/inbox/ConversationList';
import { MessageThread } from '@/components/inbox/MessageThread';
import { ContactSidebar } from '@/components/crm/ContactSidebar';
import {
  getMockConversations,
  getMockConversation,
  getMockActivities,
} from '@/lib/mock-data';

export function InboxContent() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const assignedTo = searchParams.get('assignedTo') ?? undefined;
  const unassigned = searchParams.get('unassigned') === 'true';

  const conversations = useMemo(
    () =>
      getMockConversations({
        assignedTo: assignedTo === 'me' ? 'u1' : assignedTo,
        unassigned,
        search: search || undefined,
      }),
    [assignedTo, unassigned, search]
  );

  const conversation = useMemo(
    () => (selectedId ? getMockConversation(selectedId) : null),
    [selectedId]
  );

  const activities = useMemo(
    () => (conversation?.contact?.id ? getMockActivities(conversation.contact.id) : []),
    [conversation?.contact?.id]
  );

  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = (text: string) => {
    setIsSending(true);
    setTimeout(() => setIsSending(false), 500);
  };

  const handleAddNote = (content: string) => {
    console.log('Add note:', content);
  };

  const handleUpdateStage = (stage: string) => {
    console.log('Update stage:', stage);
  };

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex w-full flex-shrink-0 flex-col border-r border-neutral-200/80 md:w-80 lg:w-96">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          search={search}
          onSearchChange={setSearch}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <MessageThread
          conversation={conversation}
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
        />
      </div>
    </div>
  );
}
