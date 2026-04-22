import { NextResponse } from 'next/server';
import { getConversationById, markConversationRead } from '@launchramp/api';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = await getCurrentOrgId();
    const conversation = await getConversationById(id, orgId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    await markConversationRead(id, orgId);

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[GET /api/conversations/:id]', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
