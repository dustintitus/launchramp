'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useActivities(contactId: string | null) {
  const { data, error, mutate } = useSWR(
    contactId ? `/api/contacts/${contactId}/activities` : null,
    fetcher
  );

  return {
    activities: Array.isArray(data) ? data : [],
    isLoading: contactId && !error && !data,
    error,
    mutate,
  };
}
