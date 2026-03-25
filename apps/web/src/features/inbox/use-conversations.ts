'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useConversations(params?: {
  assignedTo?: string;
  unassigned?: boolean;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.assignedTo) searchParams.set('assignedTo', params.assignedTo);
  if (params?.unassigned) searchParams.set('unassigned', 'true');
  if (params?.search) searchParams.set('search', params.search);

  const qs = searchParams.toString();
  const url = `/api/conversations${qs ? `?${qs}` : ''}`;

  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    conversations: data?.conversations ?? [],
    total: data?.total ?? 0,
    unreadCount: data?.unreadCount ?? 0,
    isLoading: !error && !data,
    error,
    mutate,
  };
}
