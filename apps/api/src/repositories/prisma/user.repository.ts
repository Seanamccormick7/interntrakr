import { PrismaClient } from "@prisma/client";
import { IUserRepository, UserData } from "../interfaces";

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
    // In Prisma, password is always returned unless explicitly excluded
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }
}
