import type { PrismaClient } from "@prisma/client";

export interface SystemSettingsRow {
  id: string;
  allowRegistration: boolean;
  emailVerificationRequired: boolean;
  maintenanceMessage: string | null;
  defaultTheme: string;
  allowAgencyRegistration: boolean;
  maxUsersPerAgency: number | null;
  defaultTimezone: string;
  maintenanceMode: boolean;
  updatedAt: Date;
}

export interface SystemSettingsUpdate {
  allowRegistration?: boolean;
  emailVerificationRequired?: boolean;
  maintenanceMessage?: string | null;
  defaultTheme?: string;
  allowAgencyRegistration?: boolean;
  maxUsersPerAgency?: number | null;
  defaultTimezone?: string;
  maintenanceMode?: boolean;
}

const DEFAULTS: SystemSettingsRow = {
  id: "",
  allowRegistration: true,
  emailVerificationRequired: false,
  maintenanceMessage: null,
  defaultTheme: "light",
  allowAgencyRegistration: true,
  maxUsersPerAgency: null,
  defaultTimezone: "UTC",
  maintenanceMode: false,
  updatedAt: new Date(),
};

export class SuperadminSystemSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(): Promise<SystemSettingsRow | null> {
    const row = await this.prisma.systemSettings.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!row) return null;
    return {
      id: row.id,
      allowRegistration: row.allowRegistration,
      emailVerificationRequired: row.emailVerificationRequired,
      maintenanceMessage: row.maintenanceMessage,
      defaultTheme: row.defaultTheme,
      allowAgencyRegistration: row.allowAgencyRegistration,
      maxUsersPerAgency: row.maxUsersPerAgency,
      defaultTimezone: row.defaultTimezone,
      maintenanceMode: row.maintenanceMode,
      updatedAt: row.updatedAt,
    };
  }

  async getOrCreate(): Promise<SystemSettingsRow> {
    const existing = await this.get();
    if (existing) return existing;
    const created = await this.prisma.systemSettings.create({
      data: {
        allowRegistration: DEFAULTS.allowRegistration,
        emailVerificationRequired: DEFAULTS.emailVerificationRequired,
        defaultTheme: DEFAULTS.defaultTheme,
        allowAgencyRegistration: DEFAULTS.allowAgencyRegistration,
        defaultTimezone: DEFAULTS.defaultTimezone,
        maintenanceMode: DEFAULTS.maintenanceMode,
      },
    });
    return {
      id: created.id,
      allowRegistration: created.allowRegistration,
      emailVerificationRequired: created.emailVerificationRequired,
      maintenanceMessage: created.maintenanceMessage,
      defaultTheme: created.defaultTheme,
      allowAgencyRegistration: created.allowAgencyRegistration,
      maxUsersPerAgency: created.maxUsersPerAgency,
      defaultTimezone: created.defaultTimezone,
      maintenanceMode: created.maintenanceMode,
      updatedAt: created.updatedAt,
    };
  }

  async upsert(data: SystemSettingsUpdate): Promise<SystemSettingsRow> {
    const row = await this.getOrCreate();
    const updated = await this.prisma.systemSettings.update({
      where: { id: row.id },
      data: {
        ...(data.allowRegistration !== undefined && { allowRegistration: data.allowRegistration }),
        ...(data.emailVerificationRequired !== undefined && { emailVerificationRequired: data.emailVerificationRequired }),
        ...(data.maintenanceMessage !== undefined && { maintenanceMessage: data.maintenanceMessage }),
        ...(data.defaultTheme !== undefined && { defaultTheme: data.defaultTheme }),
        ...(data.allowAgencyRegistration !== undefined && { allowAgencyRegistration: data.allowAgencyRegistration }),
        ...(data.maxUsersPerAgency !== undefined && { maxUsersPerAgency: data.maxUsersPerAgency }),
        ...(data.defaultTimezone !== undefined && { defaultTimezone: data.defaultTimezone }),
        ...(data.maintenanceMode !== undefined && { maintenanceMode: data.maintenanceMode }),
      },
    });
    return {
      id: updated.id,
      allowRegistration: updated.allowRegistration,
      emailVerificationRequired: updated.emailVerificationRequired,
      maintenanceMessage: updated.maintenanceMessage,
      defaultTheme: updated.defaultTheme,
      allowAgencyRegistration: updated.allowAgencyRegistration,
      maxUsersPerAgency: updated.maxUsersPerAgency,
      defaultTimezone: updated.defaultTimezone,
      maintenanceMode: updated.maintenanceMode,
      updatedAt: updated.updatedAt,
    };
  }
}
