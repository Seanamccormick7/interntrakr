import mongoose from "mongoose";
import { Application } from "../../models/Application";
import {
  IApplicationRepository,
  ApplicationData,
  ApplicationFilters,
  CreateApplicationData,
  UpdateApplicationData,
} from "../interfaces";

export class MongoApplicationRepository implements IApplicationRepository {
  // Fix: Accept unknown and cast internally
  private mapToData(doc: unknown): ApplicationData {
    const app = doc as Record<string, unknown>;

    return {
      id: (app._id as mongoose.Types.ObjectId).toString(),
      userId: (app.userId as mongoose.Types.ObjectId).toString(),
      collaborators: (app.collaborators as string[]) || [],
      company: app.company as string,
      role: app.role as string,
      location: app.location as string | undefined,
      link: app.link as string | undefined,
      status: app.status as ApplicationData["status"],
      deadline: app.deadline as Date | undefined,
      notes: app.notes as string | undefined,
      tags: (app.tags as string[]) || [],
      createdAt: app.createdAt as Date,
      updatedAt: app.updatedAt as Date,
    };
  }

  async find(
    userId: string,
    filters: ApplicationFilters = {},
  ): Promise<ApplicationData[]> {
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

    return applications.map((app) => this.mapToData(app));
  }

  async findById(id: string, userId: string): Promise<ApplicationData | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const application = await Application.findOne({ _id: id, userId }).lean();

    if (!application) return null;

    return this.mapToData(application);
  }

  async create(
    userId: string,
    data: CreateApplicationData,
  ): Promise<ApplicationData> {
    const application = await Application.create({
      ...data,
      userId,
    });

    return this.mapToData(application.toObject());
  }

  async update(
    id: string,
    userId: string,
    data: UpdateApplicationData,
  ): Promise<ApplicationData | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const application = await Application.findOneAndUpdate(
      { _id: id, userId },
      data,
      { new: true, runValidators: true },
    ).lean();

    if (!application) return null;

    return this.mapToData(application);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;

    const result = await Application.deleteOne({ _id: id, userId });

    return result.deletedCount > 0;
  }
}
