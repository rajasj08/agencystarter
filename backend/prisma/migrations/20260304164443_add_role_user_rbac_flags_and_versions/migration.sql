-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "isAssignable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDeletable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isEditable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permissionsVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissionSnapshotVersion" INTEGER NOT NULL DEFAULT 1;

-- Data: system role protection (SUPER_ADMIN platform; AGENCY_ADMIN tenant)
UPDATE "Role" SET "isEditable" = false, "isDeletable" = false, "isAssignable" = false
WHERE "name" = 'SUPER_ADMIN' AND "agencyId" IS NULL AND "isSystem" = true;

UPDATE "Role" SET "isEditable" = false, "isDeletable" = false, "isAssignable" = true
WHERE "name" = 'AGENCY_ADMIN' AND "agencyId" IS NOT NULL AND "isSystem" = true;
