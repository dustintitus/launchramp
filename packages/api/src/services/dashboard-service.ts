import { prisma } from '@launchramp/db';
import type { BookingStatus, StaffMemberStatus } from '@prisma/client';

export async function listBookings(organizationId: string, opts?: { limit?: number }) {
  const limit = opts?.limit ?? 50;
  return prisma.booking.findMany({
    where: { organizationId },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });
}

export async function listStaffMembers(organizationId: string) {
  return prisma.staffMember.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
  });
}

export async function countPendingBookings(organizationId: string) {
  return prisma.booking.count({
    where: { organizationId, status: 'PENDING' },
  });
}

export async function getServiceBreakdown(organizationId: string) {
  const rows = await prisma.booking.groupBy({
    by: ['service'],
    where: { organizationId },
    _count: { service: true },
  });
  return rows.map((r) => ({
    service: r.service,
    count: r._count.service,
  }));
}

export type DashboardSummary = {
  marinaName: string;
  newBookingsCount: number;
};

export async function getDashboardSummary(
  organizationId: string
): Promise<DashboardSummary> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });
  const newBookingsCount = await countPendingBookings(organizationId);
  return {
    marinaName: org?.name ?? 'Marina',
    newBookingsCount,
  };
}

export function bookingStatusToClient(status: BookingStatus): 'pending' | 'ready' | 'complete' {
  const map: Record<BookingStatus, 'pending' | 'ready' | 'complete'> = {
    PENDING: 'pending',
    READY: 'ready',
    COMPLETE: 'complete',
  };
  return map[status];
}

export function staffStatusToClient(
  status: StaffMemberStatus
): 'na' | 'pick_up' | 'available' | 'on_job' {
  const map: Record<
    StaffMemberStatus,
    'na' | 'pick_up' | 'available' | 'on_job'
  > = {
    NA: 'na',
    PICK_UP: 'pick_up',
    AVAILABLE: 'available',
    ON_JOB: 'on_job',
  };
  return map[status];
}
