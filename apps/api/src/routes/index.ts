import { Router } from "express";
import health from "./health";
import auth from "./auth";
import applications from "./applications";

const r = Router();
r.use("/", health); // /ping
r.use("/auth", auth); // /auth/register, /auth/login, /auth/me
r.use("/applications", applications); // /applications (all CRUD routes)
export default r;
