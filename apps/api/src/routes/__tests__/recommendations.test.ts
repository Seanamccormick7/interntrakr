import request from "supertest";
import { createApp } from "../../app";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from "../../__tests__/helpers/testDb";

const app = createApp();
jest.setTimeout(30000);

let accessToken: string;

// Mock fetch to avoid calling real Spring Boot service
global.fetch = jest.fn();

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();

  const response = await request(app).post("/auth/register").send({
    email: "recommendations-test@example.com",
    password: "password123",
  });

  accessToken = response.body.accessToken;
});

afterEach(() => {
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
    await request(app)
      .post("/recommendations/score")
      .send(validRequest)
      .expect(401);
  });

  it("should return 400 for missing required fields", async () => {
    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        resumeKeywords: ["javascript"],
        // missing other fields
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
  });

  it("should handle scoring service error gracefully", async () => {
    // Mock Spring Boot service error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    });

    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(500);

    expect(response.body).toHaveProperty("error");
  });

  it("should handle network errors gracefully", async () => {
    // Mock network failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const response = await request(app)
      .post("/recommendations/score")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validRequest)
      .expect(500);

    expect(response.body).toHaveProperty("error");
  });

  it("should return proper urgency bands based on score", async () => {
    const testCases = [
      { score: 0.9, expectedBand: "high" },
      { score: 0.65, expectedBand: "medium" },
      { score: 0.3, expectedBand: "low" },
    ];

    for (const testCase of testCases) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ score: testCase.score }),
      });

      const response = await request(app)
        .post("/recommendations/score")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(validRequest);

      expect(response.body.urgencyBand).toBe(testCase.expectedBand);
    }
  });
});
