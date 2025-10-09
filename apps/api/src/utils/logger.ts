import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  // redact sensitive bits in headers/body if they ever get logged
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
      "req.body.refreshToken",
      "response.headers.set-cookie",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProd
    ? {}
    : { transport: { target: "pino-pretty", options: { singleLine: true } } }),
});
