import { randomUUID } from "crypto";
import pinoHttp from "pino-http";
import type pino from "pino";
import type { Request } from "express";
import { baseLogger } from "../utils/logger";

/**
 * Factory so tests can inject a custom logger/stream.
 */
export function makeRequestLogger(logger: pino.Logger = baseLogger) {
  return pinoHttp({
    logger,

    // Ensure every request has a correlation ID, and echo it back
    genReqId: (req, res) => {
      const headerId = req.headers["x-request-id"];
      const id =
        (Array.isArray(headerId) ? headerId[0] : headerId) || randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },

    // Attach extra fields to each log line (useful for analytics/tracing)
    customProps: (req) => {
      const expressReq = req as unknown as Request;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userReq = req as any;
      return {
        userId: userReq.user?.id,
        route: expressReq.route?.path,
      };
    },

    // Helpful messages
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `ERR ${req.method} ${req.url} ${res.statusCode} ${err.message}`,

    // Keep default serializers (includes headers) so redaction can prove itself
    // quietReqLogger reduces duplicate "req received" noise
    quietReqLogger: true,
  });
}
