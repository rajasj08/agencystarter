import { plansRepository as repo, userRepository } from "../../lib/data-access.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { invalidatePlanCache } from "../../services/PlanCache.js";
import type { CreatePlanInput, UpdatePlanInput } from "./plans.validation.js";


export interface PlanEditorDTO {
  id: string;
  name: string;
  email: string;
}

export interface PlanDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  maxUsers: number;
  maxLocations: number;
  maxFacilities: number;
  maxEmployees: number;
  features: Record<string, boolean>;
  isActive: boolean;
  isDefault: boolean;
  isCustom: boolean | null;
  createdById: string | null;
  updatedById: string | null;
  updatedBy: PlanEditorDTO | null;
  createdAt: Date;
  updatedAt: Date;
}

function toDTO(
  row: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    price: number;
    maxUsers: number;
    maxLocations: number;
    maxFacilities: number;
    maxEmployees: number;
    features: unknown;
    isActive: boolean;
    isDefault: boolean;
    isCustom: boolean | null;
    createdById: string | null;
    updatedById: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  updatedBy: PlanEditorDTO | null = null
): PlanDTO {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    price: row.price,
    maxUsers: row.maxUsers,
    maxLocations: row.maxLocations,
    maxFacilities: row.maxFacilities,
    maxEmployees: row.maxEmployees,
    features: (row.features && typeof row.features === "object" && !Array.isArray(row.features)
      ? row.features as Record<string, boolean>
      : {}) as Record<string, boolean>,
    isActive: row.isActive,
    isDefault: row.isDefault,
    isCustom: row.isCustom,
    createdById: row.createdById,
    updatedById: row.updatedById,
    updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PlansService {
  async list(activeOnly: boolean): Promise<PlanDTO[]> {
    const rows = await repo.findMany(activeOnly);
    return rows.map((row) => toDTO(row, null));
  }

  async getById(id: string): Promise<PlanDTO | null> {
    const row = await repo.findById(id);
    if (!row) return null;
    let updatedBy: PlanEditorDTO | null = null;
    if (row.updatedById) {
      const user = await userRepository.findUserDisplayById(row.updatedById);
      if (user) {
        const name =
          user.displayName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;
        updatedBy = { id: user.id, name, email: user.email };
      }
    }
    return toDTO(row, updatedBy);
  }

  async create(input: CreatePlanInput): Promise<PlanDTO> {
    const existing = await repo.findByCode(input.code);
    if (existing) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Plan with code ${input.code} already exists`, 409);
    }
    const row = await repo.create(input);
    if (input.isDefault) {
      await repo.clearOtherDefaults(row.id);
    }
    invalidatePlanCache();
    return toDTO(row, null);
  }

  async update(id: string, input: UpdatePlanInput & { updatedById?: string | null }): Promise<PlanDTO> {
    const plan = await repo.findById(id);
    if (!plan) throw new AppError(ERROR_CODES.PLAN_NOT_FOUND, "Plan not found", 404);
    const row = await repo.update(id, input);
    if (input.isDefault === true) {
      await repo.clearOtherDefaults(id);
    }
    invalidatePlanCache();
    let updatedBy: PlanEditorDTO | null = null;
    if (row.updatedById) {
      const user = await userRepository.findUserDisplayById(row.updatedById);
      if (user) {
        const name =
          user.displayName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;
        updatedBy = { id: user.id, name, email: user.email };
      }
    }
    return toDTO(row, updatedBy);
  }

  /** Soft delete: set isActive = false. Fails if any agency uses this plan. */
  async remove(id: string): Promise<void> {
    const plan = await repo.findById(id);
    if (!plan) throw new AppError(ERROR_CODES.PLAN_NOT_FOUND, "Plan not found", 404);
    const count = await repo.countAgenciesByPlanId(id);
    if (count > 0) {
      throw new AppError(ERROR_CODES.PLAN_IN_USE, `Cannot delete plan: ${count} agency(ies) use it`, 403);
    }
    await repo.setInactive(id);
    invalidatePlanCache();
  }
}
