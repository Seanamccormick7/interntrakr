import { Request, Response } from "express";
import {
  applicationService,
  ApplicationFilters,
} from "../services/application.service";
import { ApplicationStatus } from "../models/Application";
import { cacheService } from "../services/cache.service";

// GET /applications
export async function getApplications(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const filters: ApplicationFilters = {};

    // Parse query parameters
    if (req.query.status) {
      filters.status = req.query.status as ApplicationStatus;
    }

    if (req.query.deadlineSoon === "1" || req.query.deadlineSoon === "true") {
      filters.deadlineSoon = true;
    }

    if (req.query.q) {
      filters.q = req.query.q as string;
    }

    // Try to get from cache first
    const cacheKey = cacheService.generateKey(req.user.userId, filters);
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      res.status(200).json(cachedData);
      return;
    }

    // Cache miss - fetch from database
    const applications = await applicationService.getApplications(
      req.user.userId,
      filters,
    );

    // Store in cache with 5-minute TTL
    await cacheService.set(cacheKey, applications, 300);

    res.status(200).json(applications);
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
}

// GET /applications/:id
export async function getApplicationById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const application = await applicationService.getApplicationById(
      req.params.id,
      req.user.userId,
    );

    res.status(200).json(application);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid application ID") {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === "Application not found") {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    console.error("Get application by ID error:", error);
    res.status(500).json({ error: "Failed to fetch application" });
  }
}

// POST /applications
export async function createApplication(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const application = await applicationService.createApplication(
      req.user.userId,
      req.body,
    );

    // Invalidate user's cache after creating application
    await cacheService.invalidateUser(req.user.userId);

    res.status(201).json(application);
  } catch (error) {
    console.error("Create application error:", error);
    res.status(500).json({ error: "Failed to create application" });
  }
}

// PUT /applications/:id
export async function updateApplication(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const application = await applicationService.updateApplication(
      req.params.id,
      req.user.userId,
      req.body,
    );

    // Invalidate user's cache after updating application
    await cacheService.invalidateUser(req.user.userId);

    res.status(200).json(application);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid application ID") {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === "Application not found") {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    console.error("Update application error:", error);
    res.status(500).json({ error: "Failed to update application" });
  }
}

// DELETE /applications/:id
export async function deleteApplication(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    await applicationService.deleteApplication(req.params.id, req.user.userId);

    // Invalidate user's cache after deleting application
    await cacheService.invalidateUser(req.user.userId);

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid application ID") {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === "Application not found") {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    console.error("Delete application error:", error);
    res.status(500).json({ error: "Failed to delete application" });
  }
}
