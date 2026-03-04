-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedById" TEXT;

-- CreateIndex
CREATE INDEX "Role_agencyId_idx" ON "Role"("agencyId");

-- CreateIndex
CREATE INDEX "User_agencyId_deletedAt_idx" ON "User"("agencyId", "deletedAt");

-- CreateIndex
CREATE INDEX "User_agencyId_roleId_status_idx" ON "User"("agencyId", "roleId", "status");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
