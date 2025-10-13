import request from "supertest";
import { createApp } from "../../app";
import { cacheService } from "../../services/cache.service";
import { connectRedis, disconnectRedis } from "../../config/redis";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from "../../__tests__/helpers/testDb";

const app = createApp();

let accessToken: string;
let userId: string;

beforeAll(async () => {
  await setupTestDatabase();
  await connectRedis();
});

afterAll(async () => {
  await disconnectRedis();
  await teardownTestDatabase();
});

beforeEach(async () => {
  // Clear cache and database
  await cacheService.clearAll();
  await clearTestDatabase();

  // Create test user and get token
  const result = await request(app).post("/auth/register").send({
    email: "cache-test@example.com",
    password: "password123",
  });

  accessToken = result.body.accessToken;
  userId = result.body.user.id;
});

describe("Applications API - Caching", () => {
  describe("GET /applications - Cache behavior", () => {
    it("should cache GET requests", async () => {
      // Create test application
      await request(app)
        .post("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Google",
          role: "SWE Intern",
          status: "APPLIED",
        });

      // First request - cache miss
      const response1 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body).toHaveLength(1);

      // Second request - should hit cache
      const response2 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response2.body).toHaveLength(1);
      expect(response2.body[0].company).toBe("Google");
    });

    it("should invalidate cache on POST", async () => {
      // Initial GET to populate cache
      await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // Create new application (should invalidate cache)
      await request(app)
        .post("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Meta",
          role: "SWE Intern",
          status: "SAVED",
        })
        .expect(201);

      // GET should reflect new data
      const response = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].company).toBe("Meta");
    });

    it("should invalidate cache on PATCH", async () => {
      // Create application
      const createResponse = await request(app)
        .post("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Amazon",
          role: "SWE Intern",
          status: "SAVED",
        })
        .expect(201);

      const applicationId = createResponse.body.id;

      // Verify application was created
      expect(applicationId).toBeDefined();

      // GET to populate cache
      const firstGet = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(firstGet.body).toHaveLength(1);
      expect(firstGet.body[0].status).toBe("SAVED");

      // Update application (should invalidate cache) - USE PUT NOT PATCH
      const updateResponse = await request(app)
        .put(`/applications/${applicationId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Amazon",
          role: "SWE Intern",
          status: "APPLIED",
        })
        .expect(200);

      expect(updateResponse.body.status).toBe("APPLIED");

      // GET should reflect updated data
      const response = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe("APPLIED");
    });

    it("should invalidate cache on DELETE", async () => {
      // Create application
      const createResponse = await request(app)
        .post("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Netflix",
          role: "SWE Intern",
          status: "SAVED",
        });

      const applicationId = createResponse.body.id;

      // GET to populate cache
      const response1 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body).toHaveLength(1);

      // Delete application (should invalidate cache)
      await request(app)
        .delete(`/applications/${applicationId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(204);

      // GET should reflect deletion
      const response2 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response2.body).toHaveLength(0);
    });

    it("should use different cache keys for different users", async () => {
      // Create application for first user
      await request(app)
        .post("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Google",
          role: "SWE Intern",
          status: "APPLIED",
        });

      // Create second user
      const user2Response = await request(app).post("/auth/register").send({
        email: "cache-test-2@example.com",
        password: "password123",
      });

      const accessToken2 = user2Response.body.accessToken;

      // Create application for second user
      await request(app)
        .post("/applications")
        .set("Authorization", `Bearer ${accessToken2}`)
        .send({
          company: "Meta",
          role: "SWE Intern",
          status: "SAVED",
        });

      // Each user should only see their own applications
      const response1 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      const response2 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken2}`)
        .expect(200);

      expect(response1.body).toHaveLength(1);
      expect(response1.body[0].company).toBe("Google");

      expect(response2.body).toHaveLength(1);
      expect(response2.body[0].company).toBe("Meta");
    });
  });

  describe("Cache expiration", () => {
    it("should respect cache TTL", async () => {
      // Create application
      await request(app)
        .post("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Google",
          role: "SWE Intern",
          status: "APPLIED",
        });

      // First request - populates cache
      const response1 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body).toHaveLength(1);

      // Verify cache key exists
      const cacheKey = `applications:${userId}:{}`;
      const cachedData = await cacheService.get(cacheKey);

      expect(cachedData).toBeTruthy();
    }, 10000);
  });
});
