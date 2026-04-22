import { NextResponse } from 'next/server';
import { listStaffMembers, staffStatusToClient } from '@launchramp/api';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET() {
  try {
    const orgId = await getCurrentOrgId();
    const rows = await listStaffMembers(orgId);
    const staff = rows.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      license: s.license,
      availability: s.availability,
      status: staffStatusToClient(s.status),
    }));

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('[GET /api/dashboard/staff]', error);
    return NextResponse.json(
      { error: 'Failed to load staff' },
      { status: 500 }
    );
  }
}
