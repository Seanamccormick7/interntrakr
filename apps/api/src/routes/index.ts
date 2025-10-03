import { Router } from "express";
import authRoutes from "./auth";
import applicationRoutes from "./applications";
import healthRoutes from "./health";

const router = Router();

// Health check route (public)
router.use("/health", healthRoutes);

// Auth routes
router.use("/auth", authRoutes);

// Application routes
router.use("/applications", applicationRoutes);

// Ping route for basic connectivity test
router.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

export default router;
