import { Router } from "express";
import { getUsersWithDeadlines } from "../controllers/users.controllers";
import { requireApiKey } from "../middleware/apiKey";

const router = Router();

router.use(requireApiKey);

router.get("/with-deadlines", getUsersWithDeadlines);

export default router;
