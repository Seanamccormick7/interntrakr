import { repositoryFactory } from "../repositories/factory";
import { UserWithDeadlines } from "../repositories/interfaces";
import { idempotencyService, IdempotencyService } from "./idempotency.service";

export class NotificationService {
  private get userRepo() {
    return repositoryFactory.getUserRepository();
  }

  constructor(
    private readonly idempotency: IdempotencyService = idempotencyService,
  ) {}

  async getUsersWithUpcomingDeadlines(
    windowDays: number = 7,
    runDate?: string,
  ): Promise<UserWithDeadlines[]> {
    if (windowDays < 1 || windowDays > 365) {
      throw new Error("Window days must be between 1 and 365");
    }

    const users =
      await this.userRepo.findUsersWithUpcomingDeadlines(windowDays);

    if (!runDate) {
      return users;
    }

    const results = await Promise.all(
      users.map(async (user) => {
        const alreadySent = await this.idempotency.isAlreadySent(
          user.email,
          runDate,
        );
        return alreadySent ? null : user;
      }),
    );

    return results.filter((u): u is UserWithDeadlines => u !== null);
  }

  async markUserNotified(email: string, runDate: string): Promise<void> {
    await this.idempotency.markAsSent(email, runDate);
  }

  formatDeadlineDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  calculateDaysUntilDeadline(deadline: Date): number {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getUrgencyLevel(daysUntil: number): "critical" | "high" | "medium" | "low" {
    if (daysUntil <= 1) return "critical";
    if (daysUntil <= 3) return "high";
    if (daysUntil <= 7) return "medium";
    return "low";
  }
}

export const notificationService = new NotificationService();
