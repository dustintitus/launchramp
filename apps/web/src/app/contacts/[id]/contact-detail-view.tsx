'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

type OrgUser = { id: string; name: string | null; email: string };

type ContactDetail = Contact & {
  createdAt: string;
  updatedAt: string;
  _count?: { conversations: number };
};

const STAGES: LifecycleStage[] = ['lead', 'qualified', 'customer', 'churned'];

const stageVariant: Record<string, 'lead' | 'qualified' | 'customer' | 'churned'> = {
  lead: 'lead',
  qualified: 'qualified',
  customer: 'customer',
  churned: 'churned',
};

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function tagsToString(tags: string[]): string {
  return tags.join(', ');
}

export function ContactDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<ContactDetail>(
    `/api/contacts/${id}`,
    fetchJSON,
    { revalidateOnFocus: true }
  );

  const { data: usersData } = useSWR<{ users: OrgUser[] }>(
    '/api/users',
    fetchJSON,
    { revalidateOnFocus: false }
  );

  const users = usersData?.users ?? [];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<LifecycleStage>('lead');
  const [ownerId, setOwnerId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data) return;
    setName(data.name ?? '');
    setEmail(data.email ?? '');
    setStage(data.stage as LifecycleStage);
    setOwnerId(data.ownerId ?? '');
    setTagsInput(tagsToString(data.tags ?? []));
    setDirty(false);
  }, [data]);

  const displayName = data ? data.name ?? formatPhone(data.phone) : '';

  const handleChange = () => setDirty(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
          stage,
          ownerId: ownerId === '' ? null : ownerId,
          tags: parseTags(tagsInput),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof json?.error === 'string' ? json.error : 'Could not save'
        );
      }
      await mutate();
      setDirty(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-neutral-500">Loading contact…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-red-600">
          {error?.message ?? 'Contact not found.'}
        </p>
        <Button variant="outline" asChild>
          <Link href="/contacts">Back to contacts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-shrink-0 flex-col gap-3 border-b border-neutral-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href="/contacts">← Back</Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{displayName}</h1>
            <p className="text-sm text-neutral-500">{formatPhone(data.phone)}</p>
          </div>
          <Badge
            variant={stageVariant[data.stage] ?? 'secondary'}
            className="hidden capitalize sm:inline-flex"
          >
            {data.stage}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!dirty || saving}
            onClick={() => {
              setName(data.name ?? '');
              setEmail(data.email ?? '');
              setStage(data.stage as LifecycleStage);
              setOwnerId(data.ownerId ?? '');
              setTagsInput(tagsToString(data.tags ?? []));
              setDirty(false);
            }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            form="contact-edit-form"
            disabled={!dirty || saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <form
          id="contact-edit-form"
          onSubmit={handleSubmit}
          className="mx-auto max-w-xl space-y-6"
        >
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900">Profile</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-1.5 block text-xs font-medium text-neutral-600"
                >
                  Name
                </label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    handleChange();
                  }}
                  placeholder="Display name"
                />
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-neutral-600">
                  Phone
                </span>
                <p className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                  {formatPhone(data.phone)}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  Phone is tied to messaging and cannot be changed here.
                </p>
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1.5 block text-xs font-medium text-neutral-600"
                >
                  Email
                </label>
                <Input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    handleChange();
                  }}
                  placeholder="name@company.com"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900">CRM</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="contact-stage"
                  className="mb-1.5 block text-xs font-medium text-neutral-600"
                >
                  Lifecycle stage
                </label>
                <select
                  id="contact-stage"
                  value={stage}
                  onChange={(e) => {
                    setStage(e.target.value as LifecycleStage);
                    handleChange();
                  }}
                  className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="contact-owner"
                  className="mb-1.5 block text-xs font-medium text-neutral-600"
                >
                  Owner
                </label>
                <select
                  id="contact-owner"
                  value={ownerId}
                  onChange={(e) => {
                    setOwnerId(e.target.value);
                    handleChange();
                  }}
                  className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name?.trim() || u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="contact-tags"
                  className="mb-1.5 block text-xs font-medium text-neutral-600"
                >
                  Tags
                </label>
                <Input
                  id="contact-tags"
                  value={tagsInput}
                  onChange={(e) => {
                    setTagsInput(e.target.value);
                    handleChange();
                  }}
                  placeholder="vip, follow-up, …"
                />
                <p className="mt-1 text-xs text-neutral-400">Comma-separated</p>
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-red-600">{saveError}</p>
          )}

          <p className="text-xs text-neutral-400">
            {data._count != null && (
              <>
                {data._count.conversations} conversation
                {data._count.conversations === 1 ? '' : 's'}
                {' · '}
              </>
            )}
            Updated {new Date(data.updatedAt).toLocaleString()}
          </p>
        </form>

        <div className="mx-auto mt-8 max-w-xl">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push('/inbox')}
          >
            Open inbox
          </Button>
        </div>
      </div>
    </div>
  );
}
