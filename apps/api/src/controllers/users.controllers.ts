import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";

export async function getUsersWithDeadlines(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;

    if (isNaN(days)) {
      res.status(400).json({
        error: "Invalid query parameter",
        message: "days must be a valid number",
      });
      return;
    }

    const users = await notificationService.getUsersWithUpcomingDeadlines(days);

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users with deadlines:", error);

    if (error instanceof Error && error.message.includes("must be between")) {
      res.status(400).json({
        error: "Invalid parameter",
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch users with upcoming deadlines",
    });
  }
}
