import type { PrismaClient, UserStatus } from "@prisma/client";
import { BaseRepository } from "../../core/BaseRepository.js";

export class AuthRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { agency: true, roleRef: { select: { id: true, name: true, permissionsVersion: true } } },
    });
  }

  /** Find user by email and agency (for SSO tenant resolution). */
  findByEmailAndAgency(email: string, agencyId: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), agencyId, deletedAt: null },
      include: { agency: true, roleRef: { select: { id: true, name: true, permissionsVersion: true } } },
    });
  }

  /** Find user by OIDC provider and provider subject id (for SSO link). */
  findByProviderId(provider: string, providerId: string) {
    return this.prisma.user.findFirst({
      where: { authProvider: "OIDC", providerId, deletedAt: null },
      include: { agency: true, roleRef: { select: { id: true, name: true, permissionsVersion: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: { agency: true, roleRef: { select: { id: true, name: true, permissionsVersion: true } } },
    });
  }

  updatePermissionSnapshotVersion(userId: string, version: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { permissionSnapshotVersion: version },
    });
  }

  createUser(data: {
    email: string;
    passwordHash?: string | null;
    displayName?: string | null;
    roleId: string;
    status: UserStatus;
    agencyId?: string | null;
    authProvider?: "LOCAL" | "OIDC";
    providerId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash ?? null,
        displayName: data.displayName ?? null,
        roleId: data.roleId,
        status: data.status,
        authProvider: data.authProvider ?? "LOCAL",
        providerId: data.providerId ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        ...(data.agencyId != null && { agencyId: data.agencyId }),
      },
      include: { agency: true, roleRef: { select: { id: true, name: true, permissionsVersion: true } } },
    });
  }

  updateLastLoginAt(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  setEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" as const, emailVerifiedAt: new Date() },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  /** When an INVITED user sets password via reset link, mark verified and active so they can log in. */
  activateInvitedUser(userId: string) {
    return this.prisma.user.updateMany({
      where: { id: userId, status: "INVITED" },
      data: { emailVerifiedAt: new Date(), status: "ACTIVE" as UserStatus },
    });
  }

  updateProfile(
    userId: string,
    data: {
      firstName?: string | null;
      lastName?: string | null;
      displayName?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      jobTitle?: string | null;
      department?: string | null;
      preferences?: Record<string, unknown> | null;
    }
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.preferences !== undefined && { preferences: data.preferences as object }),
      },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
    });
  }

  findSessionsByUserId(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Find session by id with user (for ownership/agency check). */
  findSessionById(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
      include: { user: { select: { id: true, agencyId: true } } },
    });
  }

  /** List active sessions for all users in an agency (tenant admin). */
  findSessionsByAgencyId(agencyId: string) {
    return this.prisma.session.findMany({
      where: {
        user: { agencyId, deletedAt: null },
        expiresAt: { gt: new Date() },
      },
      include: { user: { select: { id: true, email: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  deleteSessionsByUserIdExcept(userId: string, exceptSessionId: string | null) {
    const where: { userId: string; id?: { not: string } } = { userId };
    if (exceptSessionId) where.id = { not: exceptSessionId };
    return this.prisma.session.deleteMany({ where });
  }

  createSession(data: {
    userId: string;
    refreshTokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    return this.prisma.session.create({ data });
  }

  findSessionByRefreshTokenHash(hash: string) {
    return this.prisma.session.findFirst({
      where: { refreshTokenHash: hash },
      include: { user: { include: { agency: true, roleRef: { select: { id: true, name: true, permissionsVersion: true } } } } },
    });
  }

  deleteSessionById(id: string) {
    return this.prisma.session.delete({ where: { id } }).catch(() => null);
  }

  deleteSessionsByUserId(userId: string) {
    return this.prisma.session.deleteMany({ where: { userId } });
  }

  createEmailVerification(userId: string, token: string, expiresAt: Date) {
    return this.prisma.emailVerification.create({
      data: { userId, token, expiresAt },
    });
  }

  findEmailVerificationByToken(token: string) {
    return this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: { include: { agency: true } } },
    });
  }

  deleteEmailVerificationById(id: string) {
    return this.prisma.emailVerification.delete({ where: { id } }).catch(() => null);
  }

  createPasswordReset(userId: string, token: string, expiresAt: Date) {
    return this.prisma.passwordReset.create({
      data: { userId, token, expiresAt },
    });
  }

  findPasswordResetByToken(token: string) {
    return this.prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  deletePasswordResetsByUserId(userId: string) {
    return this.prisma.passwordReset.deleteMany({ where: { userId } });
  }
}
