import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { listConversations } from '@launchramp/api';
import { getCurrentOrgId, getCurrentUserId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const orgId = getCurrentOrgId();
    const { searchParams } = new URL(request.url);
    const assignedToId = searchParams.get('assignedTo');
    const unassignedOnly = searchParams.get('unassigned') === 'true';
    const search = searchParams.get('search') ?? undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 50;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : 0;

    const result = await listConversations(orgId, {
      assignedToId: assignedToId === 'me' ? getCurrentUserId() : assignedToId ?? undefined,
      unassignedOnly,
      search,
      limit,
      offset,
    });

    return NextResponse.json({
      ...result,
      meta: {
        organizationId: orgId,
        filters: {
          assignedTo: assignedToId ?? null,
          unassignedOnly,
          search: search ?? null,
        },
      },
    });
  } catch (error) {
    console.error('[GET /api/conversations]', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
