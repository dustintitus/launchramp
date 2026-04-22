-- Lightspeed cache support (contacts + bookings + sync_state).

-- Booking: Lightspeed fields
ALTER TABLE "Booking"
ADD COLUMN IF NOT EXISTS "source" TEXT,
ADD COLUMN IF NOT EXISTS "cmf" TEXT,
ADD COLUMN IF NOT EXISTS "externalBookingId" TEXT,
ADD COLUMN IF NOT EXISTS "externalCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "vin" TEXT,
ADD COLUMN IF NOT EXISTS "make" TEXT,
ADD COLUMN IF NOT EXISTS "model" TEXT,
ADD COLUMN IF NOT EXISTS "year" TEXT,
ADD COLUMN IF NOT EXISTS "jobDescription" TEXT,
ADD COLUMN IF NOT EXISTS "raw" JSONB;

-- Contact: Lightspeed fields
ALTER TABLE "Contact"
ADD COLUMN IF NOT EXISTS "source" TEXT,
ADD COLUMN IF NOT EXISTS "cmf" TEXT,
ADD COLUMN IF NOT EXISTS "externalCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "company" TEXT,
ADD COLUMN IF NOT EXISTS "phoneHome" TEXT,
ADD COLUMN IF NOT EXISTS "phoneWork" TEXT,
ADD COLUMN IF NOT EXISTS "phoneMobile" TEXT,
ADD COLUMN IF NOT EXISTS "address1" TEXT,
ADD COLUMN IF NOT EXISTS "address2" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "region" TEXT,
ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT,
ADD COLUMN IF NOT EXISTS "customerType" TEXT,
ADD COLUMN IF NOT EXISTS "marketingOptOut" BOOLEAN,
ADD COLUMN IF NOT EXISTS "raw" JSONB;

-- SyncState table
CREATE TABLE IF NOT EXISTS "SyncState" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "cmf" TEXT NOT NULL DEFAULT '',
  "lastSyncAt" TIMESTAMP(3),
  "lastSuccessAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "SyncState"
  ADD CONSTRAINT "SyncState_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Indexes / constraints (use IF NOT EXISTS where possible)
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_organizationId_source_cmf_externalBookingId_key"
ON "Booking"("organizationId", "source", "cmf", "externalBookingId");

CREATE UNIQUE INDEX IF NOT EXISTS "Contact_organizationId_source_cmf_externalCustomerId_key"
ON "Contact"("organizationId", "source", "cmf", "externalCustomerId");

CREATE UNIQUE INDEX IF NOT EXISTS "SyncState_organizationId_provider_endpoint_cmf_key"
ON "SyncState"("organizationId", "provider", "endpoint", "cmf");

CREATE INDEX IF NOT EXISTS "SyncState_organizationId_provider_idx"
ON "SyncState"("organizationId", "provider");

