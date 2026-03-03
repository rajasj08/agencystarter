import type { PrismaClient } from "@prisma/client";

export class SystemSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(): Promise<{
    allowRegistration: boolean;
    emailVerificationRequired: boolean;
    maintenanceMessage: string | null;
    defaultTheme: string;
  } | null> {
    const row = await this.prisma.systemSettings.findFirst({ orderBy: { updatedAt: "desc" } });
    return row;
  }
}
