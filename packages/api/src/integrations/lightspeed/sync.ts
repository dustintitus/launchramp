import { prisma } from '@launchramp/db';
import { LightspeedClient } from './client';

function pickFirstPhone(row: {
  CellPhone?: unknown;
  HomePhone?: unknown;
  WorkPhone?: unknown;
}): string | null {
  const candidates = [row.CellPhone, row.HomePhone, row.WorkPhone]
    .filter((x) => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
  return candidates[0] ?? null;
}

function normalizeCustId(row: { CustID?: unknown; custid?: unknown }) {
  const v = row.CustID ?? row.custid;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}

function normalizeRoHeaderId(row: { ROHeaderID?: unknown }) {
  const v = row.ROHeaderID;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}

function normalizeRono(row: { rono?: unknown }) {
  const v = row.rono;
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number') return String(v);
  return null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function deriveBookingStatus(row: Record<string, unknown>): 'PENDING' | 'READY' | 'COMPLETE' {
  const closedate = parseDate(row.closedate);
  const pudate = parseDate(row.pudate);
  if (closedate || pudate) return 'COMPLETE';

  // OpenServiceDet.Job status strings include "Ready to Work", "Scheduled", etc.
  const unit = Array.isArray((row as any).Unit) ? ((row as any).Unit as any[]) : [];
  const jobStatuses: string[] = [];
  for (const u of unit) {
    const jobs = Array.isArray(u?.Job) ? u.Job : [];
    for (const j of jobs) {
      if (typeof j?.status === 'string') jobStatuses.push(j.status);
    }
  }
  if (jobStatuses.some((s) => s.toLowerCase().includes('ready'))) return 'READY';
  return 'PENDING';
}

function extractUnitBasics(row: Record<string, unknown>) {
  const unit = Array.isArray((row as any).Unit) ? ((row as any).Unit as any[]) : [];
  const first = unit[0] ?? {};
  return {
    vin: typeof first?.VIN === 'string' ? first.VIN : null,
    make: typeof first?.Make === 'string' ? first.Make : null,
    model: typeof first?.Model === 'string' ? first.Model : null,
    year: typeof first?.Year === 'string' ? first.Year : null,
    jobDescription: (() => {
      const jobs = Array.isArray(first?.Job) ? first.Job : [];
      const j = jobs[0];
      if (typeof j?.JobTitle === 'string' && j.JobTitle.trim()) return j.JobTitle.trim();
      if (typeof j?.JobDescription === 'string' && j.JobDescription.trim()) return j.JobDescription.trim();
      return null;
    })(),
  };
}

async function upsertSyncState(args: {
  organizationId: string;
  endpoint: string;
  cmf?: string | null;
  lastSyncAt: Date;
  lastSuccessAt?: Date;
  lastError?: string | null;
}) {
  const { organizationId, endpoint, cmf, lastSyncAt, lastSuccessAt, lastError } = args;
  await prisma.syncState.upsert({
    where: {
      organizationId_provider_endpoint_cmf: {
        organizationId,
        provider: 'lightspeed',
        endpoint,
        cmf: cmf ?? '',
      },
    },
    update: {
      lastSyncAt,
      ...(lastSuccessAt ? { lastSuccessAt } : {}),
      lastError: lastError ?? null,
    },
    create: {
      organizationId,
      provider: 'lightspeed',
      endpoint,
      cmf: cmf ?? '',
      lastSyncAt,
      lastSuccessAt: lastSuccessAt ?? null,
      lastError: lastError ?? null,
    },
  });
}

export async function syncLightspeedOpenRepairOrders(args: {
  organizationId: string;
  cmf: string;
  username: string;
  password: string;
  baseUrl?: string;
}) {
  const startedAt = new Date();
  const { organizationId, cmf } = args;

  try {
    const client = new LightspeedClient({
      baseUrl: args.baseUrl,
      username: args.username,
      password: args.password,
    });

    const openRows = await client.getOpenServiceDet(cmf);

    /** Bulk `/Customer/{CMF}` is a separate 3PA entitlement; 403 is common if not purchased. */
    let customers: Awaited<ReturnType<typeof client.getCustomers>> = [];
    let customerBulkFetchFailed: string | null = null;
    try {
      customers = await client.getCustomers(cmf);
    } catch (e) {
      customerBulkFetchFailed =
        e instanceof Error ? e.message : 'Unknown error fetching customers';
    }

    const customersById = new Map<string, (typeof customers)[number]>();
    for (const c of customers) {
      const custId = normalizeCustId(c as any);
      if (custId) customersById.set(custId, c);
    }

    for (const row of openRows) {
      const custId = normalizeCustId(row as any);
      const roHeaderId = normalizeRoHeaderId(row as any);
      const rono = normalizeRono(row as any) ?? (roHeaderId ? `RO-${roHeaderId}` : null);
      if (!rono) continue;

      const customer = custId ? customersById.get(custId) : undefined;
      const phone =
        (customer ? pickFirstPhone(customer as any) : null) ??
        (custId ? `lightspeed:${custId}` : `lightspeed:unknown`);

      if (customer && custId) {
        await prisma.contact.upsert({
          where: {
            organizationId_source_cmf_externalCustomerId: {
              organizationId,
              source: 'lightspeed',
              cmf,
              externalCustomerId: custId,
            },
          },
          update: {
            phone,
            name:
              typeof (customer as any).CustFullName === 'string'
                ? (customer as any).CustFullName
                : (customer as any).FirstName || (customer as any).LastName
                  ? `${(customer as any).FirstName ?? ''} ${(customer as any).LastName ?? ''}`.trim()
                  : undefined,
            email: typeof (customer as any).EMail === 'string' ? (customer as any).EMail : undefined,
            firstName: typeof (customer as any).FirstName === 'string' ? (customer as any).FirstName : undefined,
            lastName: typeof (customer as any).LastName === 'string' ? (customer as any).LastName : undefined,
            company: typeof (customer as any).Companyname === 'string' ? (customer as any).Companyname : undefined,
            phoneMobile: typeof (customer as any).CellPhone === 'string' ? (customer as any).CellPhone : undefined,
            phoneHome: typeof (customer as any).HomePhone === 'string' ? (customer as any).HomePhone : undefined,
            phoneWork: typeof (customer as any).WorkPhone === 'string' ? (customer as any).WorkPhone : undefined,
            address1: typeof (customer as any).Address1 === 'string' ? (customer as any).Address1 : undefined,
            address2: typeof (customer as any).Address2 === 'string' ? (customer as any).Address2 : undefined,
            city: typeof (customer as any).City === 'string' ? (customer as any).City : undefined,
            region: typeof (customer as any).State === 'string' ? (customer as any).State : undefined,
            postalCode: typeof (customer as any).Zip === 'string' ? (customer as any).Zip : undefined,
            country: typeof (customer as any).Country === 'string' ? (customer as any).Country : undefined,
            customerType: typeof (customer as any).CustomerType === 'string' ? (customer as any).CustomerType : undefined,
            marketingOptOut: typeof (customer as any).optoutmarketing === 'boolean' ? (customer as any).optoutmarketing : undefined,
            raw: customer as any,
            updatedAt: new Date(),
          },
          create: {
            organizationId,
            source: 'lightspeed',
            cmf,
            externalCustomerId: custId,
            phone,
            name:
              typeof (customer as any).CustFullName === 'string'
                ? (customer as any).CustFullName
                : undefined,
            email: typeof (customer as any).EMail === 'string' ? (customer as any).EMail : undefined,
            firstName: typeof (customer as any).FirstName === 'string' ? (customer as any).FirstName : undefined,
            lastName: typeof (customer as any).LastName === 'string' ? (customer as any).LastName : undefined,
            company: typeof (customer as any).Companyname === 'string' ? (customer as any).Companyname : undefined,
            phoneMobile: typeof (customer as any).CellPhone === 'string' ? (customer as any).CellPhone : undefined,
            phoneHome: typeof (customer as any).HomePhone === 'string' ? (customer as any).HomePhone : undefined,
            phoneWork: typeof (customer as any).WorkPhone === 'string' ? (customer as any).WorkPhone : undefined,
            address1: typeof (customer as any).Address1 === 'string' ? (customer as any).Address1 : undefined,
            address2: typeof (customer as any).Address2 === 'string' ? (customer as any).Address2 : undefined,
            city: typeof (customer as any).City === 'string' ? (customer as any).City : undefined,
            region: typeof (customer as any).State === 'string' ? (customer as any).State : undefined,
            postalCode: typeof (customer as any).Zip === 'string' ? (customer as any).Zip : undefined,
            country: typeof (customer as any).Country === 'string' ? (customer as any).Country : undefined,
            customerType: typeof (customer as any).CustomerType === 'string' ? (customer as any).CustomerType : undefined,
            marketingOptOut: typeof (customer as any).optoutmarketing === 'boolean' ? (customer as any).optoutmarketing : undefined,
            raw: customer as any,
          },
        });
      } else if (custId) {
        // Placeholder contact if Lightspeed customer record is missing.
        await prisma.contact.upsert({
          where: {
            organizationId_source_cmf_externalCustomerId: {
              organizationId,
              source: 'lightspeed',
              cmf,
              externalCustomerId: custId,
            },
          },
          update: { phone, updatedAt: new Date() },
          create: {
            organizationId,
            source: 'lightspeed',
            cmf,
            externalCustomerId: custId,
            phone,
            name: `Lightspeed Customer ${custId}`,
          },
        });
      }

      const status = deriveBookingStatus(row as any);
      const unitBasics = extractUnitBasics(row as any);
      const scheduledAt =
        parseDate((row as any).promiseddate) ??
        parseDate((row as any).datein) ??
        new Date();

      await prisma.booking.upsert({
        where: {
          organizationId_source_cmf_externalBookingId: {
            organizationId,
            source: 'lightspeed',
            cmf,
            externalBookingId: roHeaderId ?? rono,
          },
        },
        update: {
          orderNumber: rono,
          service: unitBasics.jobDescription ?? 'Repair order',
          scheduledAt,
          status,
          externalCustomerId: custId,
          vin: unitBasics.vin,
          make: unitBasics.make,
          model: unitBasics.model,
          year: unitBasics.year,
          jobDescription: unitBasics.jobDescription,
          raw: row as any,
          updatedAt: new Date(),
        },
        create: {
          organizationId,
          orderNumber: rono,
          service: unitBasics.jobDescription ?? 'Repair order',
          scheduledAt,
          status,
          source: 'lightspeed',
          cmf,
          externalBookingId: roHeaderId ?? rono,
          externalCustomerId: custId,
          vin: unitBasics.vin,
          make: unitBasics.make,
          model: unitBasics.model,
          year: unitBasics.year,
          jobDescription: unitBasics.jobDescription,
          raw: row as any,
        },
      });
    }

    await upsertSyncState({
      organizationId,
      endpoint: 'OpenServiceDet+Customer',
      cmf,
      lastSyncAt: startedAt,
      lastSuccessAt: new Date(),
      lastError: null,
    });

    return {
      ok: true as const,
      openRepairOrders: openRows.length,
      customers: customers.length,
      ...(customerBulkFetchFailed
        ? { customerBulkFetchFailed }
        : {}),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    await upsertSyncState({
      organizationId,
      endpoint: 'OpenServiceDet+Customer',
      cmf,
      lastSyncAt: startedAt,
      lastError: msg,
    });
    return { ok: false as const, error: msg };
  }
}

export async function listLightspeedDealers(args: {
  username: string;
  password: string;
  baseUrl?: string;
}) {
  const client = new LightspeedClient({
    baseUrl: args.baseUrl,
    username: args.username,
    password: args.password,
  });
  const dealers = await client.listDealers();
  const cmfs = Array.from(
    new Set(
      dealers
        .map((d) => (typeof d.Cmf === 'string' ? d.Cmf.trim() : ''))
        .filter(Boolean)
    )
  ).sort();
  return { dealers, cmfs };
}

