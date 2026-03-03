-- AlterTable SystemSettings: add allowAgencyRegistration, maxUsersPerAgency, defaultTimezone, maintenanceMode
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "allowAgencyRegistration" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "maxUsersPerAgency" INTEGER;
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum AgencyStatus
DO $$ BEGIN
  CREATE TYPE "AgencyStatus" AS ENUM ('ACTIVE', 'DISABLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable Agency: add status
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "status" "AgencyStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable AuditLog: add targetUserId, impersonation
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "targetUserId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "impersonation" BOOLEAN NOT NULL DEFAULT false;
