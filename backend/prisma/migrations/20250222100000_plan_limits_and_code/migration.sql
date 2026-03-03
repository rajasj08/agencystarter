-- Plan: add code (unique), description, price, limits, isActive; remove slug, priceCents, interval
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "price" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "maxLocations" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "maxFacilities" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "maxEmployees" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Backfill code from slug for existing rows (if slug exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Plan' AND column_name = 'slug') THEN
    UPDATE "Plan" SET "code" = UPPER(REPLACE("slug", '-', '_')) WHERE "code" IS NULL AND "slug" IS NOT NULL;
  END IF;
  UPDATE "Plan" SET "code" = 'FREE' WHERE "code" IS NULL OR "code" = '';
END $$;

ALTER TABLE "Plan" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_code_key" ON "Plan"("code");

-- Drop old columns if they exist
ALTER TABLE "Plan" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "Plan" DROP COLUMN IF EXISTS "priceCents";
ALTER TABLE "Plan" DROP COLUMN IF EXISTS "interval";
