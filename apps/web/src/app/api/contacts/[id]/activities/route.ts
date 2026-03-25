import { NextResponse } from 'next/server';
import { listActivities } from '@launchramp/api';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = getCurrentOrgId();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 50;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : 0;

    const activities = await listActivities(id, orgId, { limit, offset });
    return NextResponse.json(activities);
  } catch (error) {
    console.error('[GET /api/contacts/:id/activities]', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
