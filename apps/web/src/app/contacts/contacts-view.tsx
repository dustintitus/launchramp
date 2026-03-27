'use client';

import { useDeferredValue, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatPhone } from '@/lib/utils';
import type { Contact, LifecycleStage } from '@/types';

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

type ListResponse = { contacts: Contact[]; total: number };

const stageVariant: Record<string, 'lead' | 'qualified' | 'customer' | 'churned'> = {
  lead: 'lead',
  qualified: 'qualified',
  customer: 'customer',
  churned: 'churned',
};

function normalizePhoneForCreate(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (trimmed.startsWith('+')) return `+${digits}`;
  return digits ? `+${digits}` : trimmed;
}

export function ContactsView() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [addOpen, setAddOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const listUrl =
    deferredSearch.trim().length > 0
      ? `/api/contacts?search=${encodeURIComponent(deferredSearch.trim())}`
      : '/api/contacts';

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    listUrl,
    fetchJSON,
    { revalidateOnFocus: true }
  );

  const contacts = data?.contacts ?? [];
  const total = data?.total ?? 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const normalized = normalizePhoneForCreate(phone);
    if (!normalized) {
      setCreateError('Enter a valid phone number.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalized,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof json?.error === 'string' ? json.error : 'Could not create contact'
        );
      }
      setAddOpen(false);
      setPhone('');
      setName('');
      setEmail('');
      await mutate();
      if (json?.id) {
        router.push(`/contacts/${json.id}`);
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-shrink-0 flex-col gap-4 border-b border-neutral-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Contacts</h1>
          <p className="text-sm text-neutral-500">
            {isLoading && !data ? 'Loading…' : `${total} contact${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button type="button" onClick={() => setAddOpen(true)}>
            Add contact
          </Button>
        </div>
      </header>

      {error && (
        <p className="border-b border-red-100 bg-red-50 px-6 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <div className="flex-1 overflow-auto p-6">
        {isLoading && !data ? (
          <p className="text-sm text-neutral-500">Loading contacts…</p>
        ) : contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-10 text-center">
            <p className="text-sm text-neutral-600">
              {deferredSearch.trim()
                ? 'No contacts match your search.'
                : 'No contacts yet. Add one to get started.'}
            </p>
            {!deferredSearch.trim() && (
              <Button className="mt-4" onClick={() => setAddOpen(true)}>
                Add contact
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {contacts.map((c) => {
              const display = c.name ?? formatPhone(c.phone);
              const stage = c.stage as LifecycleStage;
              return (
                <li key={c.id}>
                  <Link
                    href={`/contacts/${c.id}`}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-50"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-neutral-100 text-xs font-medium text-neutral-600">
                        {display.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-900">{display}</p>
                      <p className="truncate text-sm text-neutral-500">
                        {formatPhone(c.phone)}
                        {c.email ? ` · ${c.email}` : ''}
                      </p>
                    </div>
                    <Badge
                      variant={stageVariant[stage] ?? 'secondary'}
                      className="shrink-0 capitalize"
                    >
                      {stage}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-contact-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAddOpen(false);
              setCreateError(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">
            <h2 id="add-contact-title" className="text-lg font-semibold text-neutral-900">
              Add contact
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Phone is required. US numbers can be entered as 10 digits.
            </p>
            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="new-phone"
                  className="mb-1.5 block text-xs font-medium text-neutral-600"
                >
                  Phone
                </label>
                <Input
                  id="new-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 555 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="new-name"
                  className="mb-1.5 block text-xs font-medium text-neutral-600"
                >
                  Name
                </label>
                <Input
                  id="new-name"
                  placeholder="Optional"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="new-email"
                  className="mb-1.5 block text-xs font-medium text-neutral-600"
                >
                  Email
                </label>
                <Input
                  id="new-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Optional"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddOpen(false);
                    setCreateError(null);
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Saving…' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
