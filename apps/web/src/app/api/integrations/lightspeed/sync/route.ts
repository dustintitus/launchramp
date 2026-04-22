import { NextResponse } from 'next/server';
import { syncLightspeedOpenRepairOrders } from '@launchramp/api';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as {
      cmf?: string;
    };

    const cmf =
      typeof body.cmf === 'string' && body.cmf.trim()
        ? body.cmf.trim()
        : process.env.LIGHTSPEED_CMF;

    if (!cmf) {
      return NextResponse.json(
        { error: 'Missing cmf (pass in body.cmf or set LIGHTSPEED_CMF)' },
        { status: 400 }
      );
    }

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

    const result = await syncLightspeedOpenRepairOrders({
      organizationId: admin.organizationId,
      cmf,
      username,
      password,
      baseUrl: process.env.LIGHTSPEED_BASE_URL,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    if (msg === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[POST /api/integrations/lightspeed/sync]', e);
    return NextResponse.json(
      { error: 'Failed to run Lightspeed sync' },
      { status: 500 }
    );
  }
}

