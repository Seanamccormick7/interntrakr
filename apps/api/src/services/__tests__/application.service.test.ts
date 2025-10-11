import mongoose from "mongoose";
import { ApplicationService } from "../application.service";
import { Application, ApplicationStatus } from "../../models/Application";
import { User } from "../../models/User";

const applicationService = new ApplicationService();
let testUserId: string;

beforeAll(async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
  await mongoose.connect(mongoUri);

  // Create test user
  const user = await User.create({
    email: "test@example.com",
    password: "password123",
  });
  testUserId = (user._id as mongoose.Types.ObjectId).toString();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await Application.deleteMany({});
  await User.deleteMany({ email: { $ne: "test@example.com" } }); // Keep main test user
});

describe("ApplicationService", () => {
  describe("createApplication", () => {
    it("should create a new application", async () => {
      const data = {
        company: "Google",
        role: "Software Engineer Intern",
        status: ApplicationStatus.APPLIED,
      };

      const application = await applicationService.createApplication(
        testUserId,
        data,
      );

      expect(application.company).toBe("Google");
      expect(application.role).toBe("Software Engineer Intern");
      expect(application.status).toBe(ApplicationStatus.APPLIED);
      expect(application.userId.toString()).toBe(testUserId);
    });

    it("should create application with optional fields", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const data = {
        company: "Microsoft",
        role: "PM Intern",
        link: "https://careers.microsoft.com",
        deadline: tomorrow,
        notes: "Applied via referral",
        tags: ["referral", "priority"],
      };

      const application = await applicationService.createApplication(
        testUserId,
        data,
      );

      expect(application.link).toBe("https://careers.microsoft.com");
      expect(application.notes).toBe("Applied via referral");
      expect(application.tags).toEqual(["referral", "priority"]);
    });
  });

  describe("getApplications", () => {
    beforeEach(async () => {
      // Create test applications
      await Application.create([
        {
          userId: testUserId,
          company: "Google",
          role: "SWE Intern",
          status: ApplicationStatus.APPLIED,
        },
        {
          userId: testUserId,
          company: "Meta",
          role: "SWE Intern",
          status: ApplicationStatus.INTERVIEW,
        },
        {
          userId: testUserId,
          company: "Amazon",
          role: "SWE Intern",
          status: ApplicationStatus.SAVED,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        },
      ]);
    });

    it("should get all applications for user", async () => {
      const applications = await applicationService.getApplications(testUserId);

      expect(applications).toHaveLength(3);
    });

    it("should filter by status", async () => {
      const applications = await applicationService.getApplications(
        testUserId,
        {
          status: ApplicationStatus.APPLIED,
        },
      );

      expect(applications).toHaveLength(1);
      expect(applications[0].status).toBe(ApplicationStatus.APPLIED);
    });

    it("should filter by upcoming deadline", async () => {
      const applications = await applicationService.getApplications(
        testUserId,
        {
          deadlineSoon: true,
        },
      );

      expect(applications).toHaveLength(1);
      expect(applications[0].company).toBe("Amazon");
    });

    it("should not return other users applications", async () => {
      const otherUser = await User.create({
        email: "other@example.com",
        password: "password123",
      });

      await Application.create({
        userId: otherUser._id,
        company: "Netflix",
        role: "SWE Intern",
        status: ApplicationStatus.APPLIED,
      });

      const applications = await applicationService.getApplications(testUserId);

      expect(applications).toHaveLength(3);
      // Type as the actual return type from the service (has userId that can be converted to string)
      expect(
        applications.every(
          (app: { userId: { toString: () => string } }) =>
            app.userId.toString() === testUserId,
        ),
      ).toBe(true);
    });
  });

  describe("getApplicationById", () => {
    it("should get application by ID", async () => {
      const created = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.APPLIED,
      });

      const application = await applicationService.getApplicationById(
        (created._id as mongoose.Types.ObjectId).toString(),
        testUserId,
      );

      expect(application.company).toBe("Google");
    });

    it("should throw error for invalid ID format", async () => {
      await expect(
        applicationService.getApplicationById("invalid-id", testUserId),
      ).rejects.toThrow("Invalid application ID");
    });

    it("should throw error if application not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        applicationService.getApplicationById(fakeId, testUserId),
      ).rejects.toThrow("Application not found");
    });

    it("should not return other users application", async () => {
      const otherUser = await User.create({
        email: "other@example.com",
        password: "password123",
      });

      const created = await Application.create({
        userId: otherUser._id as mongoose.Types.ObjectId,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.APPLIED,
      });

      await expect(
        applicationService.getApplicationById(
          (created._id as mongoose.Types.ObjectId).toString(),
          testUserId,
        ),
      ).rejects.toThrow("Application not found");
    });
  });

  describe("updateApplication", () => {
    it("should update application", async () => {
      const created = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.SAVED,
      });

      const updated = await applicationService.updateApplication(
        (created._id as mongoose.Types.ObjectId).toString(),
        testUserId,
        { status: ApplicationStatus.APPLIED },
      );

      expect(updated.status).toBe(ApplicationStatus.APPLIED);
    });

    it("should throw error for invalid ID format", async () => {
      await expect(
        applicationService.updateApplication("invalid-id", testUserId, {}),
      ).rejects.toThrow("Invalid application ID");
    });

    it("should throw error if application not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        applicationService.updateApplication(fakeId, testUserId, {}),
      ).rejects.toThrow("Application not found");
    });

    it("should not update other users application", async () => {
      const otherUser = await User.create({
        email: "other@example.com",
        password: "password123",
      });

      const created = await Application.create({
        userId: otherUser._id as mongoose.Types.ObjectId,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.SAVED,
      });

      await expect(
        applicationService.updateApplication(
          (created._id as mongoose.Types.ObjectId).toString(),
          testUserId,
          {
            status: ApplicationStatus.APPLIED,
          },
        ),
      ).rejects.toThrow("Application not found");
    });
  });

  describe("deleteApplication", () => {
    it("should delete application", async () => {
      const created = await Application.create({
        userId: testUserId,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.SAVED,
      });

      const result = await applicationService.deleteApplication(
        (created._id as mongoose.Types.ObjectId).toString(),
        testUserId,
      );

      expect(result.success).toBe(true);

      const found = await Application.findById(created._id);
      expect(found).toBeNull();
    });

    it("should throw error if application not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        applicationService.deleteApplication(fakeId, testUserId),
      ).rejects.toThrow("Application not found");
    });

    it("should not delete other users application", async () => {
      const otherUser = await User.create({
        email: "other@example.com",
        password: "password123",
      });

      const created = await Application.create({
        userId: otherUser._id as mongoose.Types.ObjectId,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.SAVED,
      });

      await expect(
        applicationService.deleteApplication(
          (created._id as mongoose.Types.ObjectId).toString(),
          testUserId,
        ),
      ).rejects.toThrow("Application not found");
    });
  });
});
