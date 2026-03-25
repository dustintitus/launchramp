import { NextResponse } from 'next/server';
import { getContactById, updateContact } from '@launchramp/api';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = getCurrentOrgId();
    const contact = await getContactById(id, orgId);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('[GET /api/contacts/:id]', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = getCurrentOrgId();
    const body = await request.json();

    const contact = await updateContact(id, orgId, {
      name: body.name,
      email: body.email,
      stage: body.stage,
      ownerId: body.ownerId,
      tags: body.tags,
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('[PATCH /api/contacts/:id]', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}
