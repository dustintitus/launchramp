import { NextResponse } from 'next/server';
import { createActivity } from '@launchramp/api';
import { prisma } from '@launchramp/db';
import { getCurrentOrgId } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = await getCurrentOrgId();
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const activity = await createActivity({
      organizationId: orgId,
      contactId: id,
      type: 'note_added',
      metadata: { content },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('[POST /api/contacts/:id/notes]', error);
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}
