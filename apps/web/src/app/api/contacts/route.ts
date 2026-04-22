import { NextResponse } from 'next/server';
import { findOrCreateContact, listContacts } from '@launchramp/api';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const orgId = await getCurrentOrgId();
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') as 'lead' | 'qualified' | 'customer' | 'churned' | null;
    const ownerId = searchParams.get('ownerId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 50;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : 0;

    const result = await listContacts(orgId, {
      stage: stage ?? undefined,
      ownerId: ownerId === 'null' ? null : ownerId,
      search,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/contacts]', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const orgId = await getCurrentOrgId();
    const body = await request.json();
    const { phone, name, email } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      );
    }

    const contact = await findOrCreateContact({
      organizationId: orgId,
      phone,
      name,
      email,
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('[POST /api/contacts]', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
