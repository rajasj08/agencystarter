-- Backfill displayName from name where displayName is null/empty, then drop redundant name column
UPDATE "User"
SET "displayName" = NULLIF(TRIM("name"), '')
WHERE "name" IS NOT NULL AND (TRIM("name") != '') AND ("displayName" IS NULL OR TRIM("displayName") = '');

ALTER TABLE "User" DROP COLUMN "name";
