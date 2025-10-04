import mongoose from "mongoose";
import {
  Application,
  IApplication,
  ApplicationStatus,
} from "../models/Application";
import { websocketService } from "./websocket.service";

export interface ApplicationFilters {
  status?: ApplicationStatus;
  deadlineSoon?: boolean;
  q?: string;
}

export class ApplicationService {
  async getApplications(userId: string, filters: ApplicationFilters = {}) {
    // Build query object for MongoDB
    const query: Record<string, unknown> = { userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.deadlineSoon) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      query.deadline = {
        $gte: new Date(),
        $lte: sevenDaysFromNow,
      };
    }

    if (filters.q) {
      query.$text = { $search: filters.q };
    }

    const applications = await Application.find(query)
      .sort({ deadline: 1, createdAt: -1 })
      .lean();

    return applications;
  }

  async getApplicationById(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid application ID");
    }

    const application = await Application.findOne({ _id: id, userId }).lean();

    if (!application) {
      throw new Error("Application not found");
    }

    return application;
  }

  async createApplication(userId: string, data: Partial<IApplication>) {
    const application = await Application.create({
      ...data,
      userId,
    });

    websocketService.broadcastApplicationCreated(application);

    return application.toObject();
  }

  async updateApplication(
    id: string,
    userId: string,
    data: Partial<IApplication>,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid application ID");
    }

    // Remove userId from update data to prevent overwriting
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _, ...updateData } = data as Partial<IApplication>;

    const application = await Application.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true },
    );

    if (!application) {
      throw new Error("Application not found");
    }

    websocketService.broadcastApplicationUpdated(application);

    return application.toObject();
  }

  async deleteApplication(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid application ID");
    }

    const application = await Application.findOne({ _id: id, userId });

    if (!application) {
      throw new Error("Application not found");
    }

    const collaborators = application.collaborators || [];

    const result = await Application.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      throw new Error("Application not found");
    }

    websocketService.broadcastApplicationDeleted(id, userId, collaborators);

    return { success: true };
  }
}

export const applicationService = new ApplicationService();
