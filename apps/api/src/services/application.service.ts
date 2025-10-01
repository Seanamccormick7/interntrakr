import mongoose from "mongoose";
import {
  Application,
  IApplication,
  ApplicationStatus,
} from "../models/Application";

export interface ApplicationFilters {
  status?: ApplicationStatus;
  deadlineSoon?: boolean;
  q?: string; // Search query
}

export class ApplicationService {
  // Get all applications for a user with filters
  async getApplications(userId: string, filters: ApplicationFilters = {}) {
    const query: any = { userId };

    // Filter by status
    if (filters.status) {
      query.status = filters.status;
    }

    // Filter by upcoming deadline (within 7 days)
    if (filters.deadlineSoon) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      query.deadline = {
        $gte: new Date(),
        $lte: sevenDaysFromNow,
      };
    }

    // Text search on company, role, and notes
    if (filters.q) {
      query.$text = { $search: filters.q };
    }

    const applications = await Application.find(query)
      .sort({ deadline: 1, createdAt: -1 }) // Upcoming deadlines first, then newest
      .lean();

    return applications;
  }

  // Get single application by ID
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

  // Create new application
  async createApplication(userId: string, data: Partial<IApplication>) {
    const application = await Application.create({
      ...data,
      userId,
    });

    return application.toObject();
  }

  // Update application
  async updateApplication(
    id: string,
    userId: string,
    data: Partial<IApplication>,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid application ID");
    }

    // Prevent changing userId
    const { userId: _, ...updateData } = data as any;

    const application = await Application.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true },
    ).lean();

    if (!application) {
      throw new Error("Application not found");
    }

    return application;
  }

  // Delete application
  async deleteApplication(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid application ID");
    }

    const result = await Application.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      throw new Error("Application not found");
    }

    return { success: true };
  }
}

// Export singleton instance
export const applicationService = new ApplicationService();
