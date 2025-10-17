import { Request, Response } from "express";
import { requireApiKey } from "../apiKey";
import { env } from "../../config/env";

describe("requireApiKey middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should reject request without API key", () => {
    requireApiKey(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Missing API key",
      message: "x-api-key header is required",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with invalid API key", () => {
    mockReq.headers = { "x-api-key": "invalid-key" };

    requireApiKey(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Invalid API key",
      message: "The provided API key is not valid",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should allow request with valid API key", () => {
    mockReq.headers = { "x-api-key": env.INTERNAL_API_KEY };

    requireApiKey(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it("should handle x-api-key as string or string[]", () => {
    mockReq.headers = { "x-api-key": [env.INTERNAL_API_KEY, "extra"] };

    requireApiKey(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
