import { Router } from "express";
import { ping } from "../controllers/health.controllers";
const r = Router();
r.get("/ping", ping);
export default r;
