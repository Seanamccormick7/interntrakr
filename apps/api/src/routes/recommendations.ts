import { Router } from "express";
import { getScore } from "../controllers/score.controllers";
import { scoreRequestSchema } from "../schemas/score.schemas";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /recommendations/score
router.post("/score", validate(scoreRequestSchema), getScore);

export default router;
