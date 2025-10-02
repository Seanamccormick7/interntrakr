import bcrypt from "bcrypt";
import { User, IUser } from "../models/User";
import { generateTokens } from "../utils/jwt";
import mongoose from "mongoose";
const SALT_ROUNDS = 10;

export class AuthService {
  // Register new user
  async register(email: string, password: string) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
    });

    return {
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  // Login user
  async login(email: string, password: string) {
    // Find user and explicitly select password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
    });

    return {
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  // Verify user exists
  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }
}

// Export singleton instance
export const authService = new AuthService();
