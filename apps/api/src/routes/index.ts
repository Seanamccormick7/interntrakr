import { Router } from "express";
import authRoutes from "./auth";
import applicationRoutes from "./applications";
import recommendationsRoutes from "./recommendations";
import healthRoutes from "./health";
import usersRoutes from "./users";

const router = Router();

router.use("/health", healthRoutes);

router.use("/auth", authRoutes);

router.use("/applications", applicationRoutes);

router.use("/recommendations", recommendationsRoutes);

router.use("/users", usersRoutes);

router.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

export default router;
