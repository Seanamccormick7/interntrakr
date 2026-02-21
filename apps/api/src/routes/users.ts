import { Router } from "express";
import {
  getUsersWithDeadlines,
  markUserNotified,
} from "../controllers/users.controllers";
import { requireApiKey } from "../middleware/apiKey";

const router = Router();

router.use(requireApiKey);

router.get("/with-deadlines", getUsersWithDeadlines);
router.post("/mark-notified", markUserNotified);

export default router;
