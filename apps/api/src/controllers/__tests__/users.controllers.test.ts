import request from "supertest";
import { createApp } from "../../app";
import { User } from "../../models/User";
import { Application, ApplicationStatus } from "../../models/Application";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from "../../__tests__/helpers/testDb";
import { env } from "../../config/env";
import { UserWithDeadlines } from "../../repositories/interfaces";

const app = createApp();

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

afterEach(async () => {
  await clearTestDatabase();
});

describe("GET /users/with-deadlines", () => {
  const validApiKey = env.INTERNAL_API_KEY;

  beforeEach(async () => {
    const user1 = await User.create({
      email: "user1@example.com",
      password: "password123",
    });

    const user2 = await User.create({
      email: "user2@example.com",
      password: "password123",
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 6);

    await Application.create({
      userId: user1._id,
      company: "Google",
      role: "SWE Intern",
      status: ApplicationStatus.APPLIED,
      deadline: tomorrow,
      link: "https://careers.google.com/jobs/123",
    });

    await Application.create({
      userId: user2._id,
      company: "Meta",
      role: "Product Designer",
      status: ApplicationStatus.INTERVIEW,
      deadline: nextWeek,
    });
  });

  it("should return 401 without API key", async () => {
    const response = await request(app)
      .get("/users/with-deadlines")
      .expect(401);

    expect(response.body.error).toBe("Missing API key");
  });

  it("should return 403 with invalid API key", async () => {
    const response = await request(app)
      .get("/users/with-deadlines")
      .set("x-api-key", "invalid-key")
      .expect(403);

    expect(response.body.error).toBe("Invalid API key");
  });

  it("should return users with upcoming deadlines (default 7 days)", async () => {
    const response = await request(app)
      .get("/users/with-deadlines")
      .set("x-api-key", validApiKey)
      .expect(200);

    expect(response.body).toHaveLength(2);

    const user1 = response.body.find(
      (u: UserWithDeadlines) => u.email === "user1@example.com",
    );
    expect(user1).toBeDefined();
    expect(user1.applications).toHaveLength(1);
    expect(user1.applications[0].company).toBe("Google");
    expect(user1.applications[0].link).toBe(
      "https://careers.google.com/jobs/123",
    );

    const user2 = response.body.find(
      (u: UserWithDeadlines) => u.email === "user2@example.com",
    );
    expect(user2).toBeDefined();
    expect(user2.applications).toHaveLength(1);
    expect(user2.applications[0].company).toBe("Meta");
  });

  it("should accept custom days parameter", async () => {
    const response = await request(app)
      .get("/users/with-deadlines?days=14")
      .set("x-api-key", validApiKey)
      .expect(200);

    expect(response.body).toHaveLength(2);
  });

  it("should return 400 for invalid days parameter (not a number)", async () => {
    const response = await request(app)
      .get("/users/with-deadlines?days=invalid")
      .set("x-api-key", validApiKey)
      .expect(400);

    expect(response.body.error).toBe("Invalid query parameter");
    expect(response.body.message).toBe("days must be a valid number");
  });

  it("should return 400 for days parameter out of range (too small)", async () => {
    const response = await request(app)
      .get("/users/with-deadlines?days=0")
      .set("x-api-key", validApiKey)
      .expect(400);

    expect(response.body.error).toBe("Invalid parameter");
    expect(response.body.message).toContain("must be between");
  });

  it("should return 400 for days parameter out of range (too large)", async () => {
    const response = await request(app)
      .get("/users/with-deadlines?days=400")
      .set("x-api-key", validApiKey)
      .expect(400);

    expect(response.body.error).toBe("Invalid parameter");
    expect(response.body.message).toContain("must be between");
  });

  it("should return empty array when no users have deadlines", async () => {
    await Application.deleteMany({});

    const response = await request(app)
      .get("/users/with-deadlines")
      .set("x-api-key", validApiKey)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it("should exclude deadlines outside the window", async () => {
    await Application.deleteMany({});

    const user = await User.create({
      email: "future@example.com",
      password: "password123",
    });

    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);

    await Application.create({
      userId: user._id,
      company: "Amazon",
      role: "SDE Intern",
      status: ApplicationStatus.SAVED,
      deadline: farFuture,
    });

    const response = await request(app)
      .get("/users/with-deadlines?days=7")
      .set("x-api-key", validApiKey)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it("should include application fields needed for emails", async () => {
    const response = await request(app)
      .get("/users/with-deadlines")
      .set("x-api-key", validApiKey)
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);

    const user = response.body[0];
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("applications");

    const application = user.applications[0];
    expect(application).toHaveProperty("id");
    expect(application).toHaveProperty("company");
    expect(application).toHaveProperty("role");
    expect(application).toHaveProperty("deadline");
    expect(application).toHaveProperty("status");
  });

  it("should handle multiple applications per user", async () => {
    await Application.deleteMany({});

    const user = await User.create({
      email: "busy@example.com",
      password: "password123",
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    await Application.create({
      userId: user._id,
      company: "Google",
      role: "SWE Intern",
      status: ApplicationStatus.APPLIED,
      deadline: tomorrow,
    });

    await Application.create({
      userId: user._id,
      company: "Meta",
      role: "Data Scientist",
      status: ApplicationStatus.OA,
      deadline: dayAfter,
    });

    const response = await request(app)
      .get("/users/with-deadlines")
      .set("x-api-key", validApiKey)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].email).toBe("busy@example.com");
    expect(response.body[0].applications).toHaveLength(2);
  });
});
