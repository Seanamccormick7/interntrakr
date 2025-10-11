import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../app";
import { User } from "../../models/User";

const app = createApp();
jest.setTimeout(30000); // Increase timeout for slow tests

let accessToken: string;

// Mock fetch to avoid calling real Spring Boot service
global.fetch = jest.fn();

beforeAll(async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clean up and create fresh user for each test
  await User.deleteMany({});

  const response = await request(app).post("/auth/register").send({
    email: "recommendations-test@example.com",
    password: "password123",
  });

  accessToken = response.body.accessToken;
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

describe("POST /recommendations/score", () => {
  const validRequest = {
    resumeKeywords: ["javascript", "react", "node", "typescript"],
    jobDescription:
      "Looking for a full-stack engineer with React and Node.js experience",
    company: "Google",
    role: "Software Engineer Intern",
  };

  it("should return score data with valid request", async () => {
    // Mock successful Spring Boot response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 0.75 }),
    });

    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(200);

    expect(response.body).toHaveProperty("score");
    expect(response.body).toHaveProperty("missingKeywords");
    expect(response.body).toHaveProperty("urgencyBand");
    expect(response.body).toHaveProperty("tips");
    expect(response.body.score).toBeGreaterThanOrEqual(0);
    expect(response.body.score).toBeLessThanOrEqual(100);
    expect(["low", "medium", "high"]).toContain(response.body.urgencyBand);
    expect(Array.isArray(response.body.tips)).toBe(true);
  });

  it("should return 401 without authentication", async () => {
    const response = await request(app)
      .post("/recommendations/score")
      .send(validRequest)
      .expect(401);

    expect(response.body.error).toBe("No token provided");
  });

  it("should return 400 with missing required fields", async () => {
    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Google",
        // Missing other required fields
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toBeDefined();
    expect(Array.isArray(response.body.details)).toBe(true);
    expect(response.body.details.length).toBeGreaterThan(0);
  });

  it("should return 400 with empty resumeKeywords", async () => {
    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        ...validRequest,
        resumeKeywords: [],
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "body.resumeKeywords",
          message: expect.stringContaining("at least one keyword"),
        }),
      ]),
    );
  });

  it("should return 400 with empty jobDescription", async () => {
    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        ...validRequest,
        jobDescription: "",
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "body.jobDescription",
          message: expect.stringContaining("cannot be empty"),
        }),
      ]),
    );
  });

  it("should return 400 with missing company", async () => {
    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        resumeKeywords: ["javascript"],
        jobDescription: "Need JavaScript developer",
        role: "Engineer",
        // Missing company
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "body.company",
          message: expect.stringContaining("company is required"),
        }),
      ]),
    );
  });

  it("should return 400 with missing role", async () => {
    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        resumeKeywords: ["javascript"],
        jobDescription: "Need JavaScript developer",
        company: "Google",
        // Missing role
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "body.role",
          message: expect.stringContaining("role is required"),
        }),
      ]),
    );
  });

  it("should handle Spring Boot service timeout", async () => {
    // Mock timeout error (AbortError)
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(500);

    expect(response.body.error).toBe("Failed to calculate score");
    expect(response.body.details).toContain("timeout");
  });

  it("should handle Spring Boot service unavailable", async () => {
    // Mock connection error
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new TypeError("fetch failed"),
    );

    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(500);

    expect(response.body.error).toBe("Failed to calculate score");
    expect(response.body.details).toContain("connect");
  });

  it("should handle Spring Boot service error response", async () => {
    // Mock Spring Boot returning error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(500);

    expect(response.body.error).toBe("Failed to calculate score");
  });

  it("should handle Spring Boot service returning invalid JSON", async () => {
    // Mock invalid response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(500);

    expect(response.body.error).toBe("Failed to calculate score");
  });

  it("should calculate urgency based on score", async () => {
    // Test high score (>= 70%)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 0.85 }),
    });

    const highScoreResponse = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(200);

    expect(highScoreResponse.body.urgencyBand).toBe("high");
    expect(highScoreResponse.body.score).toBeGreaterThanOrEqual(70);

    // Test medium score (40-69%)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 0.55 }),
    });

    const mediumScoreResponse = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(200);

    expect(mediumScoreResponse.body.urgencyBand).toBe("medium");

    // Test low score (< 40%)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 0.25 }),
    });

    const lowScoreResponse = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(200);

    expect(lowScoreResponse.body.urgencyBand).toBe("low");
  });

  it("should extract missing keywords from job description", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 0.5 }),
    });

    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        resumeKeywords: ["javascript", "react"],
        jobDescription: "Need Python Django AWS experience",
        company: "Tech Corp",
        role: "Backend Engineer",
      })
      .expect(200);

    expect(response.body.missingKeywords).toEqual(
      expect.arrayContaining(["python", "django", "aws"]),
    );
  });

  it("should generate actionable tips", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 0.3 }),
    });

    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(200);

    expect(response.body.tips).toBeDefined();
    expect(Array.isArray(response.body.tips)).toBe(true);
    expect(response.body.tips.length).toBeGreaterThan(0);
    expect(response.body.tips.length).toBeLessThanOrEqual(5);

    // Tips should be strings
    response.body.tips.forEach((tip: string) => {
      expect(typeof tip).toBe("string");
      expect(tip.length).toBeGreaterThan(0);
    });
  });

  it("should call Spring Boot service with correct payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 0.75 }),
    });

    await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(200);

    // Verify fetch was called with correct params
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/score"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      }),
    );

    // Verify request body
    const call = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body).toHaveProperty("text");
    expect(body).toHaveProperty("keywords");
    expect(body.keywords).toEqual(validRequest.resumeKeywords);
  });
});
