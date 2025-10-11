import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../app";
import { Application, ApplicationStatus } from "../../models/Application";
import { User } from "../../models/User";
import { authService } from "../../services/auth.service";
import { cacheService } from "../../services/cache.service";
import { connectRedis, disconnectRedis } from "../../config/redis";

const app = createApp();

let accessToken: string;
let userId: string;

beforeAll(async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
  await mongoose.connect(mongoUri);
  await connectRedis();
});

afterAll(async () => {
  await disconnectRedis();
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clear cache and users before each test
  await cacheService.clearAll();
  await User.deleteMany({});

  // Create test user and get token
  const result = await authService.register(
    "cache-test@example.com",
    "password123",
  );
  accessToken = result.accessToken;
  userId = result.user.id;
});

afterEach(async () => {
  await Application.deleteMany({});
});

describe("Applications API - Caching", () => {
  describe("GET /applications - Cache behavior", () => {
    it("should cache GET requests", async () => {
      // Create test application
      await Application.create({
        userId,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.APPLIED,
      });

      // First request - cache miss
      const response1 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body).toHaveLength(1);

      // Manually add another application directly to DB
      await Application.create({
        userId,
        company: "Meta",
        role: "PM Intern",
        status: ApplicationStatus.SAVED,
      });

      // Second request - should get cached data (still 1 item)
      const response2 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // Should return cached result with only 1 item
      expect(response2.body).toHaveLength(1);

      // Verify cache hit by checking the key exists
      const cacheKey = cacheService.generateKey(userId, {});
      const cached = await cacheService.get(cacheKey);
      expect(cached).not.toBeNull();
    });

    it("should cache different query parameters separately", async () => {
      await Application.create([
        {
          userId,
          company: "Google",
          role: "SWE Intern",
          status: ApplicationStatus.APPLIED,
        },
        {
          userId,
          company: "Meta",
          role: "PM Intern",
          status: ApplicationStatus.SAVED,
        },
      ]);

      // Request with status filter
      const response1 = await request(app)
        .get("/applications?status=APPLIED")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body).toHaveLength(1);
      expect(response1.body[0].status).toBe("APPLIED");

      // Request with different status filter
      const response2 = await request(app)
        .get("/applications?status=SAVED")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response2.body).toHaveLength(1);
      expect(response2.body[0].status).toBe("SAVED");

      // Verify both cache keys exist
      const cacheKey1 = cacheService.generateKey(userId, {
        status: "APPLIED",
      });
      const cacheKey2 = cacheService.generateKey(userId, { status: "SAVED" });

      const cached1 = await cacheService.get(cacheKey1);
      const cached2 = await cacheService.get(cacheKey2);

      expect(cached1).not.toBeNull();
      expect(cached2).not.toBeNull();
    });
  });

  describe("Cache invalidation on mutations", () => {
    it("should invalidate cache on POST", async () => {
      // Get list (creates cache)
      const response1 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body).toHaveLength(0);

      // Create application
      await request(app)
        .post("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Google",
          role: "SWE Intern",
          status: ApplicationStatus.APPLIED,
        })
        .expect(201);

      // Next GET should have new application
      const response2 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response2.body).toHaveLength(1);
    });

    it("should invalidate cache on PUT", async () => {
      const app1 = await Application.create({
        userId,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.SAVED,
      });

      // Get list (creates cache)
      const response1 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body[0].status).toBe("SAVED");

      // Update application
      await request(app)
        .put(`/applications/${app1._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          status: ApplicationStatus.APPLIED,
        })
        .expect(200);

      // Next GET should have updated status
      const response2 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response2.body[0].status).toBe("APPLIED");
    });

    it("should invalidate cache on DELETE", async () => {
      const app1 = await Application.create({
        userId,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.APPLIED,
      });

      // Get list (creates cache)
      const response1 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body).toHaveLength(1);

      // Delete application
      await request(app)
        .delete(`/applications/${app1._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(204);

      // Next GET should have empty list
      const response2 = await request(app)
        .get("/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response2.body).toHaveLength(0);
    });
  });
});
