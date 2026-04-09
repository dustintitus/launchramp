/**
 * Microsoft Graph — client credentials + unified search.
 * Requires Azure AD app registration with application permissions (admin consent).
 * @see https://learn.microsoft.com/en-us/graph/search-concept-query
 */

export type GraphSearchHit = {
  type: 'message' | 'event' | 'driveItem' | 'unknown';
  title: string;
  subtitle?: string;
  webUrl?: string;
  resource?: Record<string, unknown>;
};

export type GraphSearchResult = {
  query: string;
  hits: GraphSearchHit[];
  rawError?: string;
};

export function isMicrosoftGraphConfigured(): boolean {
  return Boolean(
    process.env.AZURE_AD_TENANT_ID &&
      process.env.AZURE_AD_CLIENT_ID &&
      process.env.AZURE_AD_CLIENT_SECRET
  );
}

export async function getAppOnlyAccessToken(): Promise<string> {
  const tenant = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    throw new Error('MICROSOFT_GRAPH_NOT_CONFIGURED');
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    }
  );

  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    const msg =
      data.error_description ?? data.error ?? `Token request failed (${res.status})`;
    throw new Error(msg);
  }

  return data.access_token;
}

function mapHit(resource: Record<string, unknown>): GraphSearchHit {
  const odataType = String(resource['@odata.type'] ?? '');

  if (odataType.includes('message')) {
    const subject = String(resource.subject ?? '(No subject)');
    const from = resource.from as { emailAddress?: { name?: string; address?: string } } | undefined;
    const fromLine = from?.emailAddress
      ? `${from.emailAddress.name ?? ''} <${from.emailAddress.address ?? ''}>`.trim()
      : undefined;
    return {
      type: 'message',
      title: subject,
      subtitle: fromLine,
      webUrl: typeof resource.webLink === 'string' ? resource.webLink : undefined,
      resource,
    };
  }

  if (odataType.includes('event')) {
    const subject = String(resource.subject ?? '(Event)');
    const start = resource.start as { dateTime?: string } | undefined;
    return {
      type: 'event',
      title: subject,
      subtitle: start?.dateTime ? new Date(start.dateTime).toLocaleString() : undefined,
      webUrl: typeof resource.webLink === 'string' ? resource.webLink : undefined,
      resource,
    };
  }

  if (odataType.includes('driveItem')) {
    const name = String(resource.name ?? '(File)');
    const parent = resource.parentReference as { path?: string } | undefined;
    return {
      type: 'driveItem',
      title: name,
      subtitle: parent?.path,
      webUrl: typeof resource.webUrl === 'string' ? resource.webUrl : undefined,
      resource,
    };
  }

  return {
    type: 'unknown',
    title: odataType || 'Result',
    resource,
  };
}

export async function searchMicrosoft365(query: string): Promise<GraphSearchResult> {
  const q = query.trim();
  if (!q) {
    return { query: '', hits: [] };
  }

  const token = await getAppOnlyAccessToken();

  const res = await fetch('https://graph.microsoft.com/v1.0/search/query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          entityTypes: ['message', 'event', 'driveItem'],
          query: { queryString: q },
          from: 0,
          size: 20,
          enableTopResults: true,
        },
      ],
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const errMsg =
      typeof json.error === 'object' && json.error !== null
        ? JSON.stringify(json.error)
        : JSON.stringify(json);
    return {
      query: q,
      hits: [],
      rawError: errMsg,
    };
  }

  const hits: GraphSearchHit[] = [];
  const value = json.value as unknown[] | undefined;
  const first = value?.[0] as Record<string, unknown> | undefined;
  const containers = first?.hitsContainers as unknown[] | undefined;

  for (const container of containers ?? []) {
    const c = container as Record<string, unknown>;
    const containerHits = c.hits as unknown[] | undefined;
    for (const h of containerHits ?? []) {
      const hit = h as Record<string, unknown>;
      const resource = hit.resource as Record<string, unknown> | undefined;
      if (resource) {
        hits.push(mapHit(resource));
      }
    }
  }

  return { query: q, hits };
}
