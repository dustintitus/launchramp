import { NextResponse } from 'next/server';
import { listLightspeedDealers } from '@launchramp/api';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    const username = process.env.LIGHTSPEED_USERNAME;
    const password = process.env.LIGHTSPEED_PASSWORD;
    if (!username || !password) {
      return NextResponse.json(
        {
          error:
            'Missing Lightspeed credentials (set LIGHTSPEED_USERNAME and LIGHTSPEED_PASSWORD)',
        },
        { status: 500 }
      );
    }

    const result = await listLightspeedDealers({
      username,
      password,
      baseUrl: process.env.LIGHTSPEED_BASE_URL,
    });

    return NextResponse.json({ cmfs: result.cmfs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    if (msg === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[GET /api/integrations/lightspeed/dealers]', e);
    return NextResponse.json(
      { error: 'Failed to fetch Lightspeed dealers' },
      { status: 500 }
    );
  }
}

