// This test suite is MongoDB-specific (tests Mongoose model directly)
// Skip when using PostgreSQL
import mongoose from "mongoose";
import { Application, ApplicationStatus } from "../Application";
import { User } from "../User";
import { env } from "../../config/env";

// Skip these tests when using PostgreSQL since they test Mongoose models directly
const describeIfMongo = env.DB_ENGINE === "mongo" ? describe : describe.skip;

let testUserId: string;

beforeAll(async () => {
  if (env.DB_ENGINE !== "mongo") return;

  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
  await mongoose.connect(mongoUri);

  // Create test user
  const user = await User.create({
    email: "test@example.com",
    password: "hashedpassword",
  });
  // Use .id instead of ._id to avoid TypeScript 'unknown' error
  testUserId = user.id;
});

afterAll(async () => {
  if (env.DB_ENGINE !== "mongo") return;

  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  if (env.DB_ENGINE !== "mongo") return;

  await Application.deleteMany({});
});

describeIfMongo("Application Model", () => {
  describe("Schema validation", () => {
    it("should create application with required fields", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
      });

      expect(app.company).toBe("Google");
      expect(app.role).toBe("SWE Intern");
      expect(app.userId.toString()).toBe(testUserId);
      expect(app.status).toBe(ApplicationStatus.SAVED);
    });

    it("should fail without required fields", async () => {
      await expect(
        Application.create({
          company: "Google",
        }),
      ).rejects.toThrow();
    });

    it("should validate status enum", async () => {
      await expect(
        Application.create({
          userId: testUserId,
          company: "Google",
          role: "SWE Intern",
          status: "INVALID_STATUS" as unknown as ApplicationStatus,
        }),
      ).rejects.toThrow();
    });
  });

  describe("Optional fields", () => {
    it("should accept optional location field", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        location: "Mountain View, CA",
      });

      expect(app.location).toBe("Mountain View, CA");
    });

    it("should accept optional link field", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Microsoft",
        role: "SWE Intern",
        link: "https://careers.microsoft.com",
      });

      expect(app.link).toBe("https://careers.microsoft.com");
    });

    it("should accept optional deadline field", async () => {
      const deadline = new Date("2025-12-31");
      const app = await Application.create({
        userId: testUserId,
        company: "Amazon",
        role: "SWE Intern",
        deadline,
      });

      expect(app.deadline?.toISOString()).toBe(deadline.toISOString());
    });

    it("should accept optional notes field", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Meta",
        role: "SWE Intern",
        notes: "Applied via referral",
      });

      expect(app.notes).toBe("Applied via referral");
    });

    it("should accept optional tags array", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Apple",
        role: "SWE Intern",
        tags: ["referral", "priority"],
      });

      expect(app.tags).toEqual(["referral", "priority"]);
    });

    it("should default collaborators to empty array", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Netflix",
        role: "SWE Intern",
      });

      expect(app.collaborators).toEqual([]);
    });
  });

  describe("Indexes", () => {
    it("should have userId index", async () => {
      const indexes = await Application.collection.listIndexes().toArray();
      const userIdIndex = indexes.find(
        (idx: {
          key?: Record<string, unknown>;
          weights?: Record<string, unknown>;
        }) => idx.key && idx.key.userId !== undefined,
      );

      expect(userIdIndex).toBeDefined();
    });

    it("should have company index", async () => {
      const indexes = await Application.collection.listIndexes().toArray();
      const companyIndex = indexes.find(
        (idx: {
          key?: Record<string, unknown>;
          weights?: Record<string, unknown>;
        }) => idx.key && idx.key.company !== undefined,
      );

      expect(companyIndex).toBeDefined();
    });

    it("should have status index", async () => {
      const indexes = await Application.collection.listIndexes().toArray();
      const statusIndex = indexes.find(
        (idx: {
          key?: Record<string, unknown>;
          weights?: Record<string, unknown>;
        }) => idx.key && idx.key.status !== undefined,
      );

      expect(statusIndex).toBeDefined();
    });

    it("should have deadline index", async () => {
      const indexes = await Application.collection.listIndexes().toArray();
      const deadlineIndex = indexes.find(
        (idx: {
          key?: Record<string, unknown>;
          weights?: Record<string, unknown>;
        }) => idx.key && idx.key.deadline !== undefined,
      );

      expect(deadlineIndex).toBeDefined();
    });

    it("should have compound userId_status index", async () => {
      const indexes = await Application.collection.listIndexes().toArray();
      const compoundIndex = indexes.find(
        (idx: {
          key?: Record<string, unknown>;
          weights?: Record<string, unknown>;
        }) =>
          idx.key &&
          idx.key.userId !== undefined &&
          idx.key.status !== undefined,
      );

      expect(compoundIndex).toBeDefined();
    });

    it("should have text search index", async () => {
      const indexes = await Application.collection.listIndexes().toArray();
      const textIndex = indexes.find(
        (idx: {
          key?: Record<string, unknown>;
          weights?: Record<string, unknown>;
        }) => idx.weights && typeof idx.weights === "object",
      );

      expect(textIndex).toBeDefined();
      if (textIndex) {
        expect(textIndex.weights).toHaveProperty("company");
        expect(textIndex.weights).toHaveProperty("role");
        expect(textIndex.weights).toHaveProperty("notes");
      }
    });
  });

  describe("Relationships", () => {
    it("should reference User model", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
      });

      const populated = await Application.findById(app._id).populate("userId");

      expect(populated?.userId).toBeDefined();
      const populatedUser = populated?.userId as unknown as { email: string };
      expect(populatedUser.email).toBe("test@example.com");
    });
  });

  describe("Status Transitions", () => {
    it("should allow all valid status values", async () => {
      const statuses = Object.values(ApplicationStatus);

      for (const status of statuses) {
        const app = await Application.create({
          userId: testUserId,
          company: `Company ${status}`,
          role: "SWE Intern",
          status,
        });

        expect(app.status).toBe(status);
      }
    });
  });

  describe("Timestamps", () => {
    it("should auto-generate createdAt and updatedAt", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
      });

      expect(app.createdAt).toBeInstanceOf(Date);
      expect(app.updatedAt).toBeInstanceOf(Date);
    });

    it("should update updatedAt on modification", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
      });

      const originalUpdatedAt = app.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      app.status = ApplicationStatus.APPLIED;
      await app.save();

      expect(app.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });
});
