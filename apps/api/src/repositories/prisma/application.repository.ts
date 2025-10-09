import { PrismaClient, Application as PrismaApplication } from "@prisma/client";
import { ApplicationStatus } from "../../types/application.types";
import {
  IApplicationRepository,
  ApplicationData,
  ApplicationFilters,
  CreateApplicationData,
  UpdateApplicationData,
} from "../interfaces";

export class PrismaApplicationRepository implements IApplicationRepository {
  constructor(private prisma: PrismaClient) {}

  // Fix: Cast status properly with type assertion
  private mapToData(app: PrismaApplication): ApplicationData {
    return {
      id: app.id,
      userId: app.userId,
      collaborators: app.collaborators,
      company: app.company,
      role: app.role,
      location: app.location ?? undefined,
      link: app.link ?? undefined,
      status: app.status as ApplicationStatus,
      deadline: app.deadline ?? undefined,
      notes: app.notes ?? undefined,
      tags: app.tags,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  async find(
    userId: string,
    filters: ApplicationFilters = {},
  ): Promise<ApplicationData[]> {
    // Fix: Use Prisma.ApplicationWhereInput type
    interface WhereClause {
      userId: string;
      status?: ApplicationStatus;
      deadline?: {
        gte: Date;
        lte: Date;
      };
      OR?: Array<{
        company?: { contains: string; mode: "insensitive" };
        role?: { contains: string; mode: "insensitive" };
        notes?: { contains: string; mode: "insensitive" };
      }>;
    }

    const where: WhereClause = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.deadlineSoon) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      where.deadline = {
        gte: new Date(),
        lte: sevenDaysFromNow,
      };
    }

    if (filters.q) {
      where.OR = [
        { company: { contains: filters.q, mode: "insensitive" } },
        { role: { contains: filters.q, mode: "insensitive" } },
        { notes: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    const applications = await this.prisma.application.findMany({
      where,
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    });

    return applications.map((app) => this.mapToData(app));
  }

  async findById(id: string, userId: string): Promise<ApplicationData | null> {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
    });

    if (!application) return null;

    return this.mapToData(application);
  }

  async create(
    userId: string,
    data: CreateApplicationData,
  ): Promise<ApplicationData> {
    const application = await this.prisma.application.create({
      data: {
        ...data,
        userId,
        collaborators: data.collaborators || [],
        tags: data.tags || [],
      },
    });

    return this.mapToData(application);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateApplicationData,
  ): Promise<ApplicationData | null> {
    try {
      const application = await this.prisma.application.updateMany({
        where: { id, userId },
        data,
      });

      if (application.count === 0) return null;

      const updated = await this.prisma.application.findUnique({
        where: { id },
      });

      if (!updated) return null;

      return this.mapToData(updated);
    } catch {
      // Fix: Remove unused 'error' variable
      return null;
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.application.deleteMany({
        where: { id, userId },
      });

      return result.count > 0;
    } catch {
      // Fix: Remove unused 'error' variable
      return false;
    }
  }
}
