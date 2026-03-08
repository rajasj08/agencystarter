-- CreateTable
CREATE TABLE "EmailTemplateOverride" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "agencyId" TEXT,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplateOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailTemplateOverride_templateKey_idx" ON "EmailTemplateOverride"("templateKey");

-- CreateIndex
CREATE INDEX "EmailTemplateOverride_agencyId_idx" ON "EmailTemplateOverride"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplateOverride_templateKey_agencyId_key" ON "EmailTemplateOverride"("templateKey", "agencyId");
