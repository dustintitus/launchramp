import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { listBookings, bookingStatusToClient } from '@launchramp/api';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const orgId = await getCurrentOrgId();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 50;

    const rows = await listBookings(orgId, { limit });
    const bookings = rows.map((b) => ({
      id: b.id,
      orderNumber: b.orderNumber,
      service: b.service,
      scheduledAt: b.scheduledAt.toISOString(),
      status: bookingStatusToClient(b.status),
    }));

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('[GET /api/dashboard/bookings]', error);
    return NextResponse.json(
      { error: 'Failed to load bookings' },
      { status: 500 }
    );
  }
}
