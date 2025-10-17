import { PrismaClient } from "@prisma/client";
import {
  IUserRepository,
  UserData,
  UserWithDeadlines,
  ApplicationSummary,
} from "../interfaces";
import { ApplicationStatus } from "../../types/application.types";

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserData | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  async findById(id: string): Promise<UserData | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user;
  }

  async create(email: string, password: string): Promise<UserData> {
    const user = await this.prisma.user.create({
      data: { email, password },
    });

    return user;
  }

  async findByEmailWithPassword(email: string): Promise<UserData | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  async findUsersWithUpcomingDeadlines(
    windowDays: number,
  ): Promise<UserWithDeadlines[]> {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + windowDays);

    const users = await this.prisma.user.findMany({
      where: {
        applications: {
          some: {
            deadline: {
              gte: now,
              lte: cutoffDate,
            },
          },
        },
      },
      include: {
        applications: {
          where: {
            deadline: {
              gte: now,
              lte: cutoffDate,
            },
          },
          select: {
            id: true,
            company: true,
            role: true,
            deadline: true,
            link: true,
            status: true,
          },
          orderBy: {
            deadline: "asc",
          },
        },
      },
      orderBy: {
        email: "asc",
      },
    });

    type UserWithApplications = (typeof users)[0];
    type ApplicationFromDb = UserWithApplications["applications"][0];

    return users.map((user: UserWithApplications) => ({
      email: user.email,
      applications: user.applications.map(
        (app: ApplicationFromDb): ApplicationSummary => ({
          id: app.id,
          company: app.company,
          role: app.role,
          deadline: app.deadline!,
          link: app.link ?? undefined,
          status: app.status as ApplicationStatus,
        }),
      ),
    }));
  }
}
