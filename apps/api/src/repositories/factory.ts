import { env } from "../config/env";
import { IUserRepository, IApplicationRepository } from "./interfaces";
import { MongoUserRepository } from "./mongo/user.repository";
import { MongoApplicationRepository } from "./mongo/application.repository";
import { PrismaUserRepository } from "./prisma/user.repository";
import { PrismaApplicationRepository } from "./prisma/application.repository";
import { getPrismaClient } from "../config/prisma";

class RepositoryFactory {
  private userRepo?: IUserRepository;
  private applicationRepo?: IApplicationRepository;

  getUserRepository(): IUserRepository {
    if (this.userRepo) return this.userRepo;

    if (env.DB_ENGINE === "postgres") {
      const prisma = getPrismaClient();
      this.userRepo = new PrismaUserRepository(prisma);
    } else {
      this.userRepo = new MongoUserRepository();
    }

    return this.userRepo;
  }

  getApplicationRepository(): IApplicationRepository {
    if (this.applicationRepo) return this.applicationRepo;

    if (env.DB_ENGINE === "postgres") {
      const prisma = getPrismaClient();
      this.applicationRepo = new PrismaApplicationRepository(prisma);
    } else {
      this.applicationRepo = new MongoApplicationRepository();
    }

    return this.applicationRepo;
  }
}

export const repositoryFactory = new RepositoryFactory();
