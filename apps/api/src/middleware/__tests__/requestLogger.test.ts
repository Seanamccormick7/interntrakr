import express from "express";
import request from "supertest";
import pino from "pino";
import { PassThrough } from "stream";
import { makeRequestLogger } from "../requestLogger";

// Helper to capture JSON log lines from pino
function buildTestLogger() {
  const stream = new PassThrough();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs: any[] = [];
  stream.on("data", (chunk) => {
    const lines = chunk.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        logs.push(JSON.parse(line));
      } catch {
        /* ignore pretty lines */
      }
    }
  });

  const logger = pino(
    {
      level: "info",
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.body.password",
          "req.body.token",
          "req.body.refreshToken",
        ],
        censor: "[REDACTED]",
      },
      // IMPORTANT: no pretty transport in tests
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream as any,
  );

  return { logger, logs, stream };
}

function buildApp() {
  const { logger, logs } = buildTestLogger();

  const app = express();
  app.set("trust proxy", true);
  app.use(express.json());
  app.use(makeRequestLogger(logger));

  app.get("/ok", (_req, res) => res.json({ ok: true }));

  app.post("/login", (req, res) => {
    // no explicit logging of body here; pino-http logs req with headers
    res.json({ ok: true, user: req.body?.user || "anon" });
  });

  app.get("/boom", () => {
    throw new Error("fail");
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(500).json({ error: "Internal Server Error" });
  });

  return { app, logs };
}

describe("request logging middleware", () => {
  test("sets and echoes x-request-id; logs a success with responseTime", async () => {
    const { app, logs } = buildApp();
    const res = await request(app).get("/ok");
    const rid = res.headers["x-request-id"];
    expect(rid).toBeTruthy();

    // Find the success log line
    const line = logs.find((l) => l.req && l.res && l.res.statusCode === 200);
    expect(line).toBeTruthy();
    expect(line.req.id).toBe(rid);
    expect(line.responseTime).toBeDefined();
    expect(typeof line.responseTime).toBe("number");
  });

  test("respects incoming x-request-id", async () => {
    const { app, logs } = buildApp();
    const customId = "abc-123";
    const res = await request(app).get("/ok").set("x-request-id", customId);
    expect(res.headers["x-request-id"]).toBe(customId);

    const line = logs.find((l) => l.req?.id === customId);
    expect(line).toBeTruthy();
  });

  test("redacts sensitive headers", async () => {
    const { app, logs } = buildApp();
    await request(app)
      .post("/login")
      .set("Authorization", "Bearer SUPERSECRET")
      .send({ user: "jeron", password: "dontlogthis" });

    const line = logs.find((l) => l.req && l.req.method === "POST");
    // Ensure header value is censored
    expect(line.req.headers.authorization).toBe("[REDACTED]");
    // Body is not logged by default; this just verifies redaction if it ever appears
  });

  test("logs errors with 500 status code", async () => {
    const { app, logs } = buildApp();
    await request(app).get("/boom");
    // pino-http logs errors with err field
    const errorLines = logs.filter((l) => l.err || l.res?.statusCode === 500);
    expect(errorLines.length).toBeGreaterThanOrEqual(1);
    const line = logs.find((l) => l.res?.statusCode === 500);
    expect(line).toBeTruthy();
    expect(line.res.statusCode).toBe(500);
  });

  test("includes custom properties (userId, route) when available", async () => {
    const { logger, logs } = buildTestLogger();

    const app = express();
    app.use(express.json());

    // Add middleware that sets user (simulating auth)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use((req: any, _res, next) => {
      req.user = { id: "user-123" };
      next();
    });

    app.use(makeRequestLogger(logger));

    app.get("/protected", (req, res) => {
      res.json({ ok: true });
    });

    await request(app).get("/protected");

    const line = logs.find((l) => l.req && l.res && l.res.statusCode === 200);
    expect(line).toBeTruthy();
    expect(line.userId).toBe("user-123");
    expect(line.route).toBe("/protected");
  });

  test("logs appropriate success message", async () => {
    const { app, logs } = buildApp();
    await request(app).get("/ok");

    const line = logs.find((l) => l.req && l.res && l.res.statusCode === 200);
    expect(line).toBeTruthy();
    expect(line.msg).toContain("GET");
    expect(line.msg).toContain("/ok");
    expect(line.msg).toContain("200");
  });

  test("logs appropriate error message", async () => {
    const { app, logs } = buildApp();
    await request(app).get("/boom");

    const errorLine = logs.find((l) => l.err || l.res?.statusCode === 500);
    expect(errorLine).toBeTruthy();
    expect(errorLine.msg).toContain("ERR");
    expect(errorLine.msg).toContain("GET");
    expect(errorLine.msg).toContain("/boom");
    expect(errorLine.msg).toContain("500");
    expect(errorLine.msg).toContain("fail");
  });
});
