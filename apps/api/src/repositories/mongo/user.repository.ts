import mongoose from "mongoose";
import { User } from "../../models/User";
import { IUserRepository, UserData } from "../interfaces";

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
}
