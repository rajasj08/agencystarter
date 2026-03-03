import type { PrismaClient, UserStatus } from "@prisma/client";
import { BaseRepository } from "../../core/BaseRepository.js";

export class AuthRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
    });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    displayName?: string | null;
    roleId: string;
    status: UserStatus;
    agencyId?: string | null;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        displayName: data.displayName ?? null,
        roleId: data.roleId,
        status: data.status,
        ...(data.agencyId != null && { agencyId: data.agencyId }),
      },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
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
      include: { user: { include: { agency: true, roleRef: { select: { id: true, name: true } } } } },
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
