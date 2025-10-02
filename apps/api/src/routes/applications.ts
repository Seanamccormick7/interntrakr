import { Router } from "express";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/application.controllers";
import {
  validateCreateApplication,
  validateUpdateApplication,
  validateApplicationFilters,
} from "../validators/application.validators";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /applications (with optional filters)
router.get("/", validateApplicationFilters, getApplications);

// POST /applications
router.post("/", validateCreateApplication, createApplication);

// GET /applications/:id
router.get("/:id", getApplicationById);

// PUT /applications/:id
router.put("/:id", validateUpdateApplication, updateApplication);

// DELETE /applications/:id
router.delete("/:id", deleteApplication);

export default router;
