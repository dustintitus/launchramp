'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { GraphSearchHit } from '@/lib/microsoft-graph';

type ChatMessage =
  | { role: 'user'; id: string; content: string }
  | {
      role: 'assistant';
      id: string;
      content: string;
      hits?: GraphSearchHit[];
      error?: string;
      details?: string;
    };

function HitCard({ hit }: { hit: GraphSearchHit }) {
  const label =
    hit.type === 'message'
      ? 'Email'
      : hit.type === 'event'
        ? 'Calendar'
        : hit.type === 'driveItem'
          ? 'Document'
          : 'Result';

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm">
      <div className="flex items-center gap-2">
        <span className="rounded bg-dashboard-navy/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-dashboard-navy">
          {label}
        </span>
        {hit.webUrl && (
          <a
            href={hit.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-teal-700 hover:underline"
          >
            Open
          </a>
        )}
      </div>
      <p className="mt-1 text-sm font-medium text-slate-900">{hit.title}</p>
      {hit.subtitle && (
        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{hit.subtitle}</p>
      )}
    </div>
  );
}

export function MicrosoftSearchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/microsoft/status')
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => setConfigured(d.configured ?? false))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || sending) return;

    const userMsg: ChatMessage = {
      role: 'user',
      id: `u-${Date.now()}`,
      content: q,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/microsoft/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = (await res.json()) as {
        query?: string;
        hits?: GraphSearchHit[];
        error?: string;
        details?: string;
      };

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            id: `a-${Date.now()}`,
            content:
              data.error ??
              (res.status === 503
                ? 'Microsoft Graph is not configured for this environment.'
                : 'Search failed.'),
            error: data.error,
            details: typeof data.details === 'string' ? data.details : undefined,
          },
        ]);
        return;
      }

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          id: `a-${Date.now()}`,
          content:
            data.hits && data.hits.length > 0
              ? `Found ${data.hits.length} result${data.hits.length === 1 ? '' : 's'} for “${data.query ?? q}”.`
              : `No results for “${data.query ?? q}”. Try different keywords.`,
          hits: data.hits,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          id: `a-${Date.now()}`,
          content: e instanceof Error ? e.message : 'Request failed',
          error: 'network',
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending]);

  return (
    <div className="flex h-full min-h-[calc(100dvh-10rem)] flex-col p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-navy md:text-3xl">
          Microsoft 365 search
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Search mail, calendar, and documents across your organization using Microsoft Graph
          (unified search).
        </p>
        {configured === false && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">Azure AD credentials not set</p>
            <p className="mt-1 text-amber-900/90">
              Add <code className="rounded bg-amber-100 px-1 text-xs">AZURE_AD_TENANT_ID</code>,{' '}
              <code className="rounded bg-amber-100 px-1 text-xs">AZURE_AD_CLIENT_ID</code>, and{' '}
              <code className="rounded bg-amber-100 px-1 text-xs">AZURE_AD_CLIENT_SECRET</code> to
              your environment (see <code className="text-xs">.env.example</code>). Grant admin
              consent for application permissions such as Search.Read.All, Mail.Read, Calendars.Read,
              Files.Read.All.
            </p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
        <div className="space-y-4 pr-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              Ask anything — e.g. “Q4 budget”, “team offsite”, or a colleague’s name.
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[92%] rounded-2xl px-4 py-3 text-sm shadow-sm md:max-w-[80%]',
                  msg.role === 'user'
                    ? 'bg-dashboard-navy text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-800'
                )}
              >
                <p>{msg.content}</p>
                {msg.role === 'assistant' && msg.details && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-900/90 p-2 text-[10px] text-slate-100">
                    {msg.details}
                  </pre>
                )}
                {msg.role === 'assistant' && msg.hits && msg.hits.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.hits.map((h, i) => (
                      <HitCard key={`${msg.id}-${i}`} hit={h} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <p className="text-center text-xs text-slate-500">Searching Microsoft 365…</p>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          placeholder="Type a search query…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          className="min-h-[88px] flex-1 resize-none"
          disabled={sending}
        />
        <Button
          type="button"
          className="shrink-0 sm:h-[88px] sm:px-8"
          onClick={() => void send()}
          disabled={sending || !input.trim()}
        >
          Search
        </Button>
      </div>
    </div>
  );
}
