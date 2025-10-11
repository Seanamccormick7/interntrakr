import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controllers";
import { registerSchema, loginSchema } from "../schemas/auth.schemas";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

const router = Router();

// POST /auth/register
router.post("/register", validate(registerSchema), register);

// POST /auth/login
router.post("/login", validate(loginSchema), login);

// GET /auth/me (protected)
router.get("/me", requireAuth, getCurrentUser);

export default router;
