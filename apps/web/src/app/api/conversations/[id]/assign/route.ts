import { NextResponse } from 'next/server';
import { assignConversation } from '@launchramp/api';
import { getCurrentOrgId, getCurrentUserId } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = getCurrentOrgId();
    const body = await request.json();
    const assignedToId = body.assignedToId as string | null;

    const conversation = await assignConversation(id, orgId, assignedToId);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[PATCH /api/conversations/:id/assign]', error);
    return NextResponse.json(
      { error: 'Failed to assign conversation' },
      { status: 500 }
    );
  }
}
