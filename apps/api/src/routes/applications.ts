import { Router } from "express";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/application.controllers";
import {
  createApplicationSchema,
  updateApplicationSchema,
  applicationFiltersSchema,
} from "../schemas/application.schemas";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /applications (with optional filters)
router.get("/", validate(applicationFiltersSchema), getApplications);

// POST /applications
router.post("/", validate(createApplicationSchema), createApplication);

// GET /applications/:id
router.get("/:id", getApplicationById);

// PUT /applications/:id
router.put("/:id", validate(updateApplicationSchema), updateApplication);

// DELETE /applications/:id
router.delete("/:id", deleteApplication);

export default router;
