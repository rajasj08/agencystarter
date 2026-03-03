import type { PrismaClient } from "@prisma/client";

export class RoleRepository {
  constructor(private prisma: PrismaClient) {}

  findSystemRoleByName(name: string) {
    return this.prisma.role.findFirst({
      where: { name, agencyId: null, isSystem: true },
    });
  }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { key: "asc" },
      select: { id: true, key: true, name: true, description: true, isSystem: true },
    });
  }

  /** System roles (agencyId null) plus agency-scoped roles for the given agencyId. */
  listRolesForAgency(agencyId: string | null) {
    return this.prisma.role.findMany({
      where: agencyId ? { OR: [{ agencyId: null }, { agencyId }] } : { agencyId: null },
      orderBy: [{ agencyId: "asc" }, { name: "asc" }],
      include: {
        rolePermissions: { select: { permissionId: true } },
      },
    });
  }

  findRoleById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { select: { permissionId: true } } },
    });
  }

  /** Create custom role for an agency with permissions. */
  async createRoleWithPermissions(data: { name: string; agencyId: string; permissionIds: string[] }) {
    const role = await this.prisma.role.create({
      data: { name: data.name, agencyId: data.agencyId, isSystem: false },
    });
    if (data.permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: data.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
      });
    }
    return this.findRoleById(role.id)!;
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }
    return this.findRoleById(roleId)!;
  }

  updateRole(id: string, data: { name?: string }) {
    return this.prisma.role.update({
      where: { id },
      data: { ...(data.name !== undefined && { name: data.name }) },
      include: { rolePermissions: { select: { permissionId: true } } },
    });
  }

  deleteRole(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }
}
