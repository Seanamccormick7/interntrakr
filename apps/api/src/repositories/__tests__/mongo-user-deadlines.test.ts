import mongoose from "mongoose";
import { User } from "../../models/User";
import { Application, ApplicationStatus } from "../../models/Application";
import { MongoUserRepository } from "../mongo/user.repository";

const userRepo = new MongoUserRepository();

beforeAll(async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
  await Application.deleteMany({});
});

describe("MongoUserRepository - findUsersWithUpcomingDeadlines", () => {
  it("should return users with applications due in next 7 days", async () => {
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
    });

    await Application.create({
      userId: user2._id,
      company: "Meta",
      role: "Product Designer",
      status: ApplicationStatus.INTERVIEW,
      deadline: nextWeek,
    });

    const results = await userRepo.findUsersWithUpcomingDeadlines(7);

    expect(results).toHaveLength(2);
    expect(results[0].email).toBe("user1@example.com");
    expect(results[0].applications).toHaveLength(1);
    expect(results[0].applications[0].company).toBe("Google");
    expect(results[1].email).toBe("user2@example.com");
    expect(results[1].applications).toHaveLength(1);
  });

  it("should not return applications outside the window", async () => {
    const user = await User.create({
      email: "user@example.com",
      password: "password123",
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);

    await Application.create({
      userId: user._id,
      company: "Past Deadline",
      role: "Old Role",
      status: ApplicationStatus.REJECTED,
      deadline: yesterday,
    });

    await Application.create({
      userId: user._id,
      company: "Far Future",
      role: "Future Role",
      status: ApplicationStatus.SAVED,
      deadline: farFuture,
    });

    const results = await userRepo.findUsersWithUpcomingDeadlines(7);

    expect(results).toHaveLength(0);
  });

  it("should group multiple applications for same user", async () => {
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

    const results = await userRepo.findUsersWithUpcomingDeadlines(7);

    expect(results).toHaveLength(1);
    expect(results[0].email).toBe("busy@example.com");
    expect(results[0].applications).toHaveLength(2);
    expect(results[0].applications[0].company).toBe("Google");
    expect(results[0].applications[1].company).toBe("Meta");
  });

  it("should not return users with no upcoming deadlines", async () => {
    await User.create({
      email: "noDeadlines@example.com",
      password: "password123",
    });

    const results = await userRepo.findUsersWithUpcomingDeadlines(7);

    expect(results).toHaveLength(0);
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

    const results7Days = await userRepo.findUsersWithUpcomingDeadlines(7);
    expect(results7Days).toHaveLength(0);

    const results30Days = await userRepo.findUsersWithUpcomingDeadlines(30);
    expect(results30Days).toHaveLength(1);
    expect(results30Days[0].applications).toHaveLength(1);
  });

  it("should include all required application fields", async () => {
    const user = await User.create({
      email: "user@example.com",
      password: "password123",
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Application.create({
      userId: user._id,
      company: "Google",
      role: "SWE Intern",
      status: ApplicationStatus.APPLIED,
      deadline: tomorrow,
      link: "https://careers.google.com/jobs/123",
    });

    const results = await userRepo.findUsersWithUpcomingDeadlines(7);

    expect(results).toHaveLength(1);
    const app = results[0].applications[0];
    expect(app).toHaveProperty("id");
    expect(app).toHaveProperty("company");
    expect(app).toHaveProperty("role");
    expect(app).toHaveProperty("deadline");
    expect(app).toHaveProperty("link");
    expect(app).toHaveProperty("status");
    expect(app.link).toBe("https://careers.google.com/jobs/123");
  });
});
