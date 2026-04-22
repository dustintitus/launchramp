import { NextResponse } from 'next/server';
import { getServiceBreakdown } from '@launchramp/api';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET() {
  try {
    const orgId = await getCurrentOrgId();
    const breakdown = await getServiceBreakdown(orgId);
    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error('[GET /api/dashboard/service-breakdown]', error);
    return NextResponse.json(
      { error: 'Failed to load service breakdown' },
      { status: 500 }
    );
  }
}
