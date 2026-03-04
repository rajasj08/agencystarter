-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('PLATFORM', 'TENANT');

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "scope" "PermissionScope" NOT NULL DEFAULT 'TENANT';
