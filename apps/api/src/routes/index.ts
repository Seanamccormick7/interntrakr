import { Router } from "express";
import health from "./health";
import auth from "./auth";

const r = Router();
r.use("/", health); // /ping
r.use("/auth", auth); // /auth/register, /auth/login, /auth/me
export default r;
