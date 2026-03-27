import { NextResponse } from 'next/server';
import { listUsersByOrganization } from '@launchramp/api';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET() {
  try {
    const orgId = getCurrentOrgId();
    const users = await listUsersByOrganization(orgId);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('[GET /api/users]', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
