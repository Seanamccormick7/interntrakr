import { Router } from "express";
import health from "./health";

const r = Router();
r.use("/", health); // /ping
export default r;
