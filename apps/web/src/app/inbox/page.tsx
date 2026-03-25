import { Suspense } from 'react';
import { InboxContent } from './inbox-content';

export const dynamic = 'force-dynamic';

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-500">Loading inbox...</p>
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
