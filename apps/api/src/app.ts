import express from "express";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/error";
import routes from "./routes";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
