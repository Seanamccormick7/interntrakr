// apps/api/src/services/application.service.ts

import { ApplicationStatus } from "../types/application.types";
import { websocketService } from "./websocket.service";
import { repositoryFactory } from "../repositories/factory";
import {
  ApplicationFilters,
  CreateApplicationData,
  UpdateApplicationData,
} from "../repositories/interfaces";

// Export for controllers to use
export { ApplicationFilters, ApplicationStatus };

// ---- Temporary runtime guards until Zod is added ----
const FORBIDDEN_FIELDS = new Set<string>([
  "userId",
  "ownerId",
  "_id",
  "id",
  "createdAt",
  "updatedAt",
]);

/**
 * Reject payloads that try to:
 *  - overwrite ownership/system fields
 *  - use Mongo operators like $set/$push
 *  - use dot-path updates like "userId.$set" or "ownerId.something"
 */
function assertSafeUpdatePayload(data: unknown) {
  if (!data || typeof data !== "object") return;

  const keys = Object.keys(data as Record<string, unknown>);

  const forbidden = keys.filter((k) => FORBIDDEN_FIELDS.has(k));
  if (forbidden.length) {
    throw new Error(
      `Forbidden fields in update payload: ${forbidden.join(", ")}`,
    );
  }

  const hasOperatorsOrDotPaths = keys.some(
    (k) => k.startsWith("$") || k.includes("."),
  );
  if (hasOperatorsOrDotPaths) {
    throw new Error(
      "Update payload contains disallowed operators or dot-paths.",
    );
  }
}
// -----------------------------------------------------

export class ApplicationService {
  private get repo() {
    return repositoryFactory.getApplicationRepository();
  }

  async getApplications(userId: string, filters: ApplicationFilters = {}) {
    return await this.repo.find(userId, filters);
  }

  async getApplicationById(id: string, userId: string) {
    const application = await this.repo.findById(id, userId);

    if (!application) {
      throw new Error("Application not found");
    }

    return application;
  }

  async createApplication(userId: string, data: CreateApplicationData) {
    const application = await this.repo.create(userId, data);
    websocketService.broadcastApplicationCreated(application);
    return application;
  }

  async updateApplication(
    id: string,
    userId: string,
    data: UpdateApplicationData,
  ) {
    // Temporary guard until Zod validation is added
    assertSafeUpdatePayload(data);

    // Repo must scope by { id, userId } internally to prevent cross-tenant writes.
    const application = await this.repo.update(id, userId, data);

    if (!application) {
      throw new Error("Application not found");
    }

    websocketService.broadcastApplicationUpdated(application);
    return application;
  }

  async deleteApplication(id: string, userId: string) {
    // Get application first to access collaborators
    const application = await this.repo.findById(id, userId);

    if (!application) {
      throw new Error("Application not found");
    }

    const success = await this.repo.delete(id, userId);

    if (!success) {
      throw new Error("Application not found");
    }

    websocketService.broadcastApplicationDeleted(
      id,
      userId,
      application.collaborators,
    );

    return { success: true };
  }
}

export const applicationService = new ApplicationService();
