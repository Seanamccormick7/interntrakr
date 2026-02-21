import { NotificationService } from "../notification.service";
import { IdempotencyService } from "../idempotency.service";
import { repositoryFactory } from "../../repositories/factory";
import { UserWithDeadlines } from "../../repositories/interfaces";
import { ApplicationStatus } from "../../types/application.types";

jest.mock("../../repositories/factory");

const mockUserRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findUsersWithUpcomingDeadlines: jest.fn(),
};

(repositoryFactory.getUserRepository as jest.Mock).mockReturnValue(
  mockUserRepo,
);

const mockIdempotency = {
  isAlreadySent: jest.fn(),
  markAsSent: jest.fn(),
} as unknown as IdempotencyService;

const notificationService = new NotificationService(mockIdempotency);

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockIdempotency.isAlreadySent as jest.Mock).mockResolvedValue(false);
    (mockIdempotency.markAsSent as jest.Mock).mockResolvedValue(undefined);
  });

  describe("getUsersWithUpcomingDeadlines", () => {
    it("should return users with upcoming deadlines", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockUsers: UserWithDeadlines[] = [
        {
          email: "user1@example.com",
          applications: [
            {
              id: "1",
              company: "Google",
              role: "SWE Intern",
              deadline: tomorrow,
              status: ApplicationStatus.APPLIED,
            },
          ],
        },
      ];

      mockUserRepo.findUsersWithUpcomingDeadlines.mockResolvedValue(mockUsers);

      const result = await notificationService.getUsersWithUpcomingDeadlines(7);

      expect(result).toEqual(mockUsers);
      expect(mockUserRepo.findUsersWithUpcomingDeadlines).toHaveBeenCalledWith(
        7,
      );
    });

    it("should use default window of 7 days", async () => {
      mockUserRepo.findUsersWithUpcomingDeadlines.mockResolvedValue([]);

      await notificationService.getUsersWithUpcomingDeadlines();

      expect(mockUserRepo.findUsersWithUpcomingDeadlines).toHaveBeenCalledWith(
        7,
      );
    });

    it("should accept custom window days", async () => {
      mockUserRepo.findUsersWithUpcomingDeadlines.mockResolvedValue([]);

      await notificationService.getUsersWithUpcomingDeadlines(14);

      expect(mockUserRepo.findUsersWithUpcomingDeadlines).toHaveBeenCalledWith(
        14,
      );
    });

    it("should throw error for invalid window days (too small)", async () => {
      await expect(
        notificationService.getUsersWithUpcomingDeadlines(0),
      ).rejects.toThrow("Window days must be between 1 and 365");
    });

    it("should throw error for invalid window days (too large)", async () => {
      await expect(
        notificationService.getUsersWithUpcomingDeadlines(366),
      ).rejects.toThrow("Window days must be between 1 and 365");
    });

    it("should return empty array when no users have deadlines", async () => {
      mockUserRepo.findUsersWithUpcomingDeadlines.mockResolvedValue([]);

      const result = await notificationService.getUsersWithUpcomingDeadlines(7);

      expect(result).toEqual([]);
    });

    it("should return all users when runDate is not provided", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockUsers: UserWithDeadlines[] = [
        {
          email: "user1@example.com",
          applications: [
            {
              id: "1",
              company: "Google",
              role: "SWE Intern",
              deadline: tomorrow,
              status: ApplicationStatus.APPLIED,
            },
          ],
        },
      ];

      mockUserRepo.findUsersWithUpcomingDeadlines.mockResolvedValue(mockUsers);

      const result = await notificationService.getUsersWithUpcomingDeadlines(7);

      expect(result).toEqual(mockUsers);
      expect(mockIdempotency.isAlreadySent).not.toHaveBeenCalled();
    });

    it("should filter out users already notified for the given runDate", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockUsers: UserWithDeadlines[] = [
        {
          email: "already-sent@example.com",
          applications: [
            {
              id: "1",
              company: "Google",
              role: "SWE Intern",
              deadline: tomorrow,
              status: ApplicationStatus.APPLIED,
            },
          ],
        },
        {
          email: "not-sent@example.com",
          applications: [
            {
              id: "2",
              company: "Meta",
              role: "PM Intern",
              deadline: tomorrow,
              status: ApplicationStatus.APPLIED,
            },
          ],
        },
      ];

      mockUserRepo.findUsersWithUpcomingDeadlines.mockResolvedValue(mockUsers);
      (mockIdempotency.isAlreadySent as jest.Mock)
        .mockResolvedValueOnce(true) // already-sent@example.com
        .mockResolvedValueOnce(false); // not-sent@example.com

      const result = await notificationService.getUsersWithUpcomingDeadlines(
        7,
        "2024-01-15",
      );

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("not-sent@example.com");
    });

    it("should return empty array when all users already notified for runDate", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockUsers: UserWithDeadlines[] = [
        {
          email: "user1@example.com",
          applications: [
            {
              id: "1",
              company: "Google",
              role: "SWE Intern",
              deadline: tomorrow,
              status: ApplicationStatus.APPLIED,
            },
          ],
        },
      ];

      mockUserRepo.findUsersWithUpcomingDeadlines.mockResolvedValue(mockUsers);
      (mockIdempotency.isAlreadySent as jest.Mock).mockResolvedValue(true);

      const result = await notificationService.getUsersWithUpcomingDeadlines(
        7,
        "2024-01-15",
      );

      expect(result).toEqual([]);
    });
  });

  describe("markUserNotified", () => {
    it("should delegate to idempotency.markAsSent", async () => {
      await notificationService.markUserNotified(
        "user@example.com",
        "2024-01-15",
      );

      expect(mockIdempotency.markAsSent).toHaveBeenCalledWith(
        "user@example.com",
        "2024-01-15",
      );
    });
  });

  describe("formatDeadlineDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2025-10-20T12:00:00Z");
      const formatted = notificationService.formatDeadlineDate(date);

      expect(formatted).toMatch(/Oct/);
      expect(formatted).toMatch(/20/);
      expect(formatted).toMatch(/2025/);
    });

    it("should include weekday in formatted date", () => {
      const date = new Date("2025-10-20T12:00:00Z");
      const formatted = notificationService.formatDeadlineDate(date);

      expect(formatted).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    });
  });

  describe("calculateDaysUntilDeadline", () => {
    it("should calculate days correctly for future date", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);

      const days = notificationService.calculateDaysUntilDeadline(tomorrow);

      expect(days).toBeGreaterThanOrEqual(1);
      expect(days).toBeLessThanOrEqual(2);
    });

    it("should return 0 or 1 for today", () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const days = notificationService.calculateDaysUntilDeadline(today);

      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(1);
    });

    it("should return negative for past dates", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const days = notificationService.calculateDaysUntilDeadline(yesterday);

      expect(days).toBeLessThanOrEqual(0);
    });

    it("should calculate correct days for week ahead", () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(12, 0, 0, 0);

      const days = notificationService.calculateDaysUntilDeadline(nextWeek);

      expect(days).toBeGreaterThanOrEqual(6);
      expect(days).toBeLessThanOrEqual(8);
    });
  });

  describe("getUrgencyLevel", () => {
    it("should return critical for 0-1 days", () => {
      expect(notificationService.getUrgencyLevel(0)).toBe("critical");
      expect(notificationService.getUrgencyLevel(1)).toBe("critical");
    });

    it("should return high for 2-3 days", () => {
      expect(notificationService.getUrgencyLevel(2)).toBe("high");
      expect(notificationService.getUrgencyLevel(3)).toBe("high");
    });

    it("should return medium for 4-7 days", () => {
      expect(notificationService.getUrgencyLevel(4)).toBe("medium");
      expect(notificationService.getUrgencyLevel(5)).toBe("medium");
      expect(notificationService.getUrgencyLevel(6)).toBe("medium");
      expect(notificationService.getUrgencyLevel(7)).toBe("medium");
    });

    it("should return low for 8+ days", () => {
      expect(notificationService.getUrgencyLevel(8)).toBe("low");
      expect(notificationService.getUrgencyLevel(14)).toBe("low");
      expect(notificationService.getUrgencyLevel(30)).toBe("low");
    });

    it("should handle negative days (past deadlines)", () => {
      expect(notificationService.getUrgencyLevel(-1)).toBe("critical");
      expect(notificationService.getUrgencyLevel(-5)).toBe("critical");
    });
  });
});
