import { NotificationService } from "../notification.service";
import { User } from "../../models/User";
import { Application, ApplicationStatus } from "../../models/Application";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from "../../__tests__/helpers/testDb";

const notificationService = new NotificationService();

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

afterEach(async () => {
  await clearTestDatabase();
});

describe("NotificationService - Integration", () => {
  describe("getUsersWithUpcomingDeadlines", () => {
    it("should return users with applications in deadline window", async () => {
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

      const results =
        await notificationService.getUsersWithUpcomingDeadlines(7);

      expect(results).toHaveLength(2);

      const user1Result = results.find((r) => r.email === "user1@example.com");
      expect(user1Result).toBeDefined();
      expect(user1Result!.applications).toHaveLength(1);
      expect(user1Result!.applications[0].company).toBe("Google");
      expect(user1Result!.applications[0].link).toBe(
        "https://careers.google.com/jobs/123",
      );

      const user2Result = results.find((r) => r.email === "user2@example.com");
      expect(user2Result).toBeDefined();
      expect(user2Result!.applications).toHaveLength(1);
      expect(user2Result!.applications[0].company).toBe("Meta");
    });

    it("should exclude users with no upcoming deadlines", async () => {
      await User.create({
        email: "noDeadlines@example.com",
        password: "password123",
      });

      const results =
        await notificationService.getUsersWithUpcomingDeadlines(7);

      expect(results).toHaveLength(0);
    });

    it("should exclude deadlines outside the window", async () => {
      const user = await User.create({
        email: "user@example.com",
        password: "password123",
      });

      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);

      await Application.create({
        userId: user._id,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.SAVED,
        deadline: farFuture,
      });

      const results =
        await notificationService.getUsersWithUpcomingDeadlines(7);

      expect(results).toHaveLength(0);
    });

    it("should group multiple applications per user", async () => {
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

      const results =
        await notificationService.getUsersWithUpcomingDeadlines(7);

      expect(results).toHaveLength(1);
      expect(results[0].email).toBe("busy@example.com");
      expect(results[0].applications).toHaveLength(2);
    });

    it("should respect custom window parameter", async () => {
      const user = await User.create({
        email: "user@example.com",
        password: "password123",
      });

      const twoWeeksOut = new Date();
      twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

      await Application.create({
        userId: user._id,
        company: "Google",
        role: "SWE Intern",
        status: ApplicationStatus.APPLIED,
        deadline: twoWeeksOut,
      });

      const results7Days =
        await notificationService.getUsersWithUpcomingDeadlines(7);
      expect(results7Days).toHaveLength(0);

      const results30Days =
        await notificationService.getUsersWithUpcomingDeadlines(30);
      expect(results30Days).toHaveLength(1);
      expect(results30Days[0].applications).toHaveLength(1);
    });
  });
});
