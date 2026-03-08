-- AlterTable SystemSettings: remove defaultTheme and defaultTimezone (controlled by system settings UI; these were unused or moved)
ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "defaultTheme";
ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "defaultTimezone";
