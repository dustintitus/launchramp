'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useConversation(id: string | null) {
  const { data, error, mutate } = useSWR(
    id ? `/api/conversations/${id}` : null,
    fetcher
  );

  return {
    conversation: data,
    isLoading: id && !error && !data,
    error,
    mutate,
  };
}
