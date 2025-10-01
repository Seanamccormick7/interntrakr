import mongoose from "mongoose";
import { Application, ApplicationStatus } from "../Application";
import { User } from "../User";

let testUserId: mongoose.Types.ObjectId;

beforeAll(async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
  await mongoose.connect(mongoUri);

  // Create a test user
  const user = await User.create({
    email: "test@example.com",
    password: "password123",
  });
  testUserId = user._id as mongoose.Types.ObjectId;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await Application.deleteMany({});
});

describe("Application Model", () => {
  // Ensure indexes are created before running index tests
  beforeAll(async () => {
    await Application.init(); // This creates all indexes
  });
  describe("Validation", () => {
    it("should create a valid application", async () => {
      const appData = {
        userId: testUserId,
        company: "Google",
        role: "Software Engineer Intern",
        status: ApplicationStatus.APPLIED,
      };

      const app = await Application.create(appData);

      expect(app.company).toBe("Google");
      expect(app.role).toBe("Software Engineer Intern");
      expect(app.status).toBe(ApplicationStatus.APPLIED);
      expect(app.userId.toString()).toBe(testUserId.toString());
      expect(app.createdAt).toBeDefined();
      expect(app.updatedAt).toBeDefined();
    });

    it("should require userId", async () => {
      const app = new Application({
        company: "Google",
        role: "SWE Intern",
      });

      await expect(app.save()).rejects.toThrow();
    });

    it("should require company", async () => {
      const app = new Application({
        userId: testUserId,
        role: "SWE Intern",
      });

      await expect(app.save()).rejects.toThrow();
    });

    it("should require role", async () => {
      const app = new Application({
        userId: testUserId,
        company: "Google",
      });

      await expect(app.save()).rejects.toThrow();
    });

    it("should default status to SAVED", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
      });

      expect(app.status).toBe(ApplicationStatus.SAVED);
    });

    it("should validate status enum", async () => {
      const app = new Application({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        status: "INVALID_STATUS" as any,
      });

      await expect(app.save()).rejects.toThrow();
    });

    it("should validate URL format for link", async () => {
      const app = new Application({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        link: "not-a-url",
      });

      await expect(app.save()).rejects.toThrow(/valid URL/);
    });

    it("should accept valid URLs", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        link: "https://careers.google.com/job123",
      });

      expect(app.link).toBe("https://careers.google.com/job123");
    });

    it("should enforce max length on notes", async () => {
      const longNotes = "x".repeat(5001);
      const app = new Application({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        notes: longNotes,
      });

      await expect(app.save()).rejects.toThrow(/cannot exceed 5000/);
    });

    it("should trim company and role", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "  Google  ",
        role: "  SWE Intern  ",
      });

      expect(app.company).toBe("Google");
      expect(app.role).toBe("SWE Intern");
    });
  });

  describe("Optional Fields", () => {
    it("should accept location", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        location: "Mountain View, CA",
      });

      expect(app.location).toBe("Mountain View, CA");
    });

    it("should accept deadline", async () => {
      const deadline = new Date("2025-12-31");
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        deadline,
      });

      expect(app.deadline?.toISOString()).toBe(deadline.toISOString());
    });

    it("should accept notes", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        notes: "Applied through referral",
      });

      expect(app.notes).toBe("Applied through referral");
    });

    it("should accept tags", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        tags: ["referral", "priority"],
      });

      expect(app.tags).toEqual(["referral", "priority"]);
    });

    it("should default tags to empty array", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
      });

      expect(app.tags).toEqual([]);
    });

    it("should accept collaborators", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        collaborators: ["user123", "user456"],
      });

      expect(app.collaborators).toEqual(["user123", "user456"]);
    });

    it("should default collaborators to empty array", async () => {
      const app = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
      });

      expect(app.collaborators).toEqual([]);
    });
  });

  describe("Indexes", () => {
    it("should have userId index", async () => {
      const indexes = await Application.collection.getIndexes();
      const userIdIndex = Object.keys(indexes).find((key) =>
        key.includes("userId"),
      );

      expect(userIdIndex).toBeDefined();
    });

    it("should have company index", async () => {
      const indexes = await Application.collection.getIndexes();
      const companyIndex = Object.keys(indexes).find((key) =>
        key.includes("company"),
      );

      expect(companyIndex).toBeDefined();
    });

    it("should have status index", async () => {
      const indexes = await Application.collection.getIndexes();
      const statusIndex = Object.keys(indexes).find((key) =>
        key.includes("status"),
      );

      expect(statusIndex).toBeDefined();
    });

    it("should have deadline index", async () => {
      const indexes = await Application.collection.getIndexes();
      const deadlineIndex = Object.keys(indexes).find((key) =>
        key.includes("deadline"),
      );

      expect(deadlineIndex).toBeDefined();
    });

    it("should have compound userId_status index", async () => {
      const indexes = await Application.collection.getIndexes();
      const compoundIndex = Object.keys(indexes).find(
        (key) => key.includes("userId") && key.includes("status"),
      );

      expect(compoundIndex).toBeDefined();
    });

    it("should have text search index", async () => {
      const indexes = await Application.collection.listIndexes().toArray();

      // Look for text index by checking weights property
      const textIndex = indexes.find(
        (index: any) => index.weights && typeof index.weights === "object",
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
      expect((populated?.userId as any).email).toBe("test@example.com");
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
