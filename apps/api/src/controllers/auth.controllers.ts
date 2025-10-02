import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import mongoose from "mongoose";

// POST /auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await authService.register(email, password);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User already exists") {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
}

// POST /auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid credentials") {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
}

// GET /auth/me (protected route to test auth)
export async function getCurrentUser(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
}
