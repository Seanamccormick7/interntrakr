import mongoose from "mongoose";
import { User } from "../../models/User";
import { Application } from "../../models/Application";
import {
  IUserRepository,
  UserData,
  UserWithDeadlines,
  ApplicationSummary,
} from "../interfaces";
import { ApplicationStatus } from "../../types/application.types";

export class MongoUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserData | null> {
    const user = await User.findOne({ email }).lean();
    if (!user) return null;

    return {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findById(id: string): Promise<UserData | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const user = await User.findById(id).lean();
    if (!user) return null;

    return {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(email: string, password: string): Promise<UserData> {
    const user = await User.create({ email, password });

    return {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByEmailWithPassword(email: string): Promise<UserData | null> {
    const user = await User.findOne({ email }).select("+password").lean();
    if (!user) return null;

    return {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findUsersWithUpcomingDeadlines(
    windowDays: number,
  ): Promise<UserWithDeadlines[]> {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + windowDays);

    interface AggregationResult {
      _id: mongoose.Types.ObjectId;
      email: string;
      applications: Array<{
        _id: mongoose.Types.ObjectId;
        company: string;
        role: string;
        deadline: Date;
        link?: string;
        status: ApplicationStatus;
      }>;
    }

    const results = await Application.aggregate<AggregationResult>([
      {
        $match: {
          deadline: {
            $gte: now,
            $lte: cutoffDate,
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $group: {
          _id: "$userId",
          email: { $first: "$user.email" },
          applications: {
            $push: {
              _id: "$_id",
              company: "$company",
              role: "$role",
              deadline: "$deadline",
              link: "$link",
              status: "$status",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          email: 1,
          applications: 1,
        },
      },
      {
        $sort: {
          email: 1,
        },
      },
    ]);

    return results.map((result) => ({
      email: result.email,
      applications: result.applications.map(
        (app): ApplicationSummary => ({
          id: app._id.toString(),
          company: app.company,
          role: app.role,
          deadline: app.deadline,
          link: app.link,
          status: app.status,
        }),
      ),
    }));
  }
}
