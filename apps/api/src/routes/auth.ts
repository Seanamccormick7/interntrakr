import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controllers";
import { validateRegister, validateLogin } from "../validators/auth.validators";
import { requireAuth } from "../middleware/auth";

const router = Router();

// POST /auth/register
router.post("/register", validateRegister, register);

// POST /auth/login
router.post("/login", validateLogin, login);

// GET /auth/me (protected)
router.get("/me", requireAuth, getCurrentUser);

export default router;
