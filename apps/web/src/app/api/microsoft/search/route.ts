import { NextResponse } from 'next/server';
import {
  isMicrosoftGraphConfigured,
  searchMicrosoft365,
} from '@/lib/microsoft-graph';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!isMicrosoftGraphConfigured()) {
      return NextResponse.json(
        {
          error: 'Microsoft Graph is not configured. Set AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, and AZURE_AD_CLIENT_SECRET.',
          code: 'NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { query?: string };
    const query = typeof body.query === 'string' ? body.query : '';
    if (!query.trim()) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    const result = await searchMicrosoft365(query);
    if (result.rawError) {
      return NextResponse.json(
        {
          error: 'Microsoft Graph search failed',
          details: result.rawError,
          query: result.query,
          hits: result.hits,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Search failed';
    console.error('[POST /api/microsoft/search]', e);
    return NextResponse.json(
      { error: msg, code: 'SEARCH_ERROR' },
      { status: 500 }
    );
  }
}
