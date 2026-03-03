-- Add optional planId to Agency for superadmin agency management
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "planId" TEXT;

ALTER TABLE "Agency" ADD CONSTRAINT "Agency_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
