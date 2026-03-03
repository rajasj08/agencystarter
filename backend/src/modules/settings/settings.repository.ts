import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { BaseRepository } from "../../core/BaseRepository.js";

/** Identity keys stored on Agency table. Slug is immutable after creation. */
const IDENTITY_KEYS = ["name", "slug", "logo", "websiteUrl", "supportEmail", "supportPhone", "contactFirstName", "contactLastName", "contactEmail", "contactPhone"] as const;
const UPDATABLE_IDENTITY_KEYS = ["name", "logo", "websiteUrl", "supportEmail", "supportPhone", "contactFirstName", "contactLastName", "contactEmail", "contactPhone"] as const;

export class SettingsRepository extends BaseRepository {
  constructor(client: PrismaClient) {
    super(client);
  }

  async getAgencyWithSettings(agencyId: string) {
    return this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        websiteUrl: true,
        supportEmail: true,
        supportPhone: true,
        contactFirstName: true,
        contactLastName: true,
        contactEmail: true,
        contactPhone: true,
        settings: true,
      },
    });
  }

  async getAgencySettings(agencyId: string): Promise<Prisma.JsonValue> {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { settings: true },
    });
    return agency?.settings ?? {};
  }

  async updateAgencySettings(
    agencyId: string,
    identity: Partial<{
      name: string;
      slug: string;
      logo: string | null;
      websiteUrl: string | null;
      supportEmail: string | null;
      supportPhone: string | null;
      contactFirstName: string | null;
      contactLastName: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
    }>,
    settingsJson: Prisma.JsonObject
  ): Promise<void> {
    const data: Record<string, unknown> = { settings: settingsJson };
    if (identity.name !== undefined) data.name = identity.name;
    // slug is immutable – never update from settings
    if (identity.logo !== undefined) data.logo = identity.logo;
    if (identity.websiteUrl !== undefined) data.websiteUrl = identity.websiteUrl;
    if (identity.supportEmail !== undefined) data.supportEmail = identity.supportEmail;
    if (identity.supportPhone !== undefined) data.supportPhone = identity.supportPhone;
    if (identity.contactFirstName !== undefined) data.contactFirstName = identity.contactFirstName;
    if (identity.contactLastName !== undefined) data.contactLastName = identity.contactLastName;
    if (identity.contactEmail !== undefined) data.contactEmail = identity.contactEmail;
    if (identity.contactPhone !== undefined) data.contactPhone = identity.contactPhone;
    await this.prisma.agency.update({
      where: { id: agencyId },
      data: data as Parameters<typeof this.prisma.agency.update>[0]["data"],
    });
  }
}

export { IDENTITY_KEYS, UPDATABLE_IDENTITY_KEYS };
