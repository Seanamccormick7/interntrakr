import { Router } from "express";
import { getScore } from "../controllers/score.controllers";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /recommendations/score
router.post("/score", getScore);

export default router;
