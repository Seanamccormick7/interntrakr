import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";

const RUN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

    const runDate = req.query.runDate as string | undefined;

    if (runDate && !RUN_DATE_PATTERN.test(runDate)) {
      res.status(400).json({
        error: "Invalid query parameter",
        message: "runDate must be in YYYY-MM-DD format",
      });
      return;
    }

    const users = await notificationService.getUsersWithUpcomingDeadlines(
      days,
      runDate,
    );

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

export async function markUserNotified(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { email, runDate } = req.body as {
      email?: string;
      runDate?: string;
    };

    if (!email || !runDate) {
      res.status(400).json({
        error: "Invalid request body",
        message: "email and runDate are required",
      });
      return;
    }

    if (!RUN_DATE_PATTERN.test(runDate)) {
      res.status(400).json({
        error: "Invalid request body",
        message: "runDate must be in YYYY-MM-DD format",
      });
      return;
    }

    await notificationService.markUserNotified(email, runDate);

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error marking user notified:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to mark user as notified",
    });
  }
}
