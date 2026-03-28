import { NextResponse } from 'next/server';
import { getDashboardSummary } from '@launchramp/api';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET() {
  try {
    const orgId = getCurrentOrgId();
    const summary = await getDashboardSummary(orgId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('[GET /api/dashboard/summary]', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard summary' },
      { status: 500 }
    );
  }
}
