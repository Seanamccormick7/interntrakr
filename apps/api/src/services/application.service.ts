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
