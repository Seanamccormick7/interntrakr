import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../app";
import { User } from "../../models/User";
import { Application, ApplicationStatus } from "../../models/Application";

const app = createApp();
let accessToken: string;
let userId: string;

beforeAll(async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
  await mongoose.connect(mongoUri);

  // Register user and get token
  const response = await request(app).post("/auth/register").send({
    email: "test@example.com",
    password: "password123",
  });

  accessToken = response.body.accessToken;
  userId = response.body.user.id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await Application.deleteMany({});
  await User.deleteMany({ email: { $ne: "test@example.com" } }); // Keep main test user
});

describe("GET /applications", () => {
  beforeEach(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

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
        role: "SWE Intern",
        status: ApplicationStatus.INTERVIEW,
      },
      {
        userId,
        company: "Amazon",
        role: "SWE Intern",
        status: ApplicationStatus.SAVED,
        deadline: tomorrow,
      },
    ]);
  });

  it("should return all applications with valid token", async () => {
    const response = await request(app)
      .get("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveLength(3);
  });

  it("should return 401 without token", async () => {
    await request(app).get("/applications").expect(401);
  });

  it("should filter by status", async () => {
    const response = await request(app)
      .get("/applications?status=APPLIED")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe("APPLIED");
  });

  it("should filter by deadlineSoon", async () => {
    const response = await request(app)
      .get("/applications?deadlineSoon=1")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].company).toBe("Amazon");
  });

  it("should return 400 for invalid status", async () => {
    const response = await request(app)
      .get("/applications?status=INVALID")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
  });

  it("should only return current users applications", async () => {
    // Create another user
    const otherResponse = await request(app).post("/auth/register").send({
      email: "other@example.com",
      password: "password123",
    });

    // Create application for other user
    await Application.create({
      userId: otherResponse.body.user.id,
      company: "Netflix",
      role: "SWE Intern",
      status: ApplicationStatus.APPLIED,
    });

    const response = await request(app)
      .get("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    // Should only see own applications
    expect(response.body).toHaveLength(3);
  });
});

describe("POST /applications", () => {
  it("should create application with valid data", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Stripe",
        role: "Software Engineer Intern",
        status: "APPLIED",
      })
      .expect(201);

    expect(response.body.company).toBe("Stripe");
    expect(response.body.role).toBe("Software Engineer Intern");
    expect(response.body.userId).toBe(userId);
  });

  it("should return 401 without token", async () => {
    await request(app)
      .post("/applications")
      .send({
        company: "Stripe",
        role: "SWE Intern",
      })
      .expect(401);
  });

  it("should return 400 for missing company", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        role: "SWE Intern",
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toContain("Company is required");
  });

  it("should return 400 for missing role", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Stripe",
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toContain("Role is required");
  });

  it("should return 400 for invalid link", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Stripe",
        role: "SWE Intern",
        link: "not-a-url",
      })
      .expect(400);

    expect(response.body.details).toContain(
      "Link must be a valid URL starting with http:// or https://",
    );
  });

  it("should create application with optional fields", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Stripe",
        role: "SWE Intern",
        link: "https://stripe.com/jobs",
        deadline: tomorrow.toISOString(),
        notes: "Referred by friend",
        tags: ["referral"],
      })
      .expect(201);

    expect(response.body.link).toBe("https://stripe.com/jobs");
    expect(response.body.notes).toBe("Referred by friend");
    expect(response.body.tags).toEqual(["referral"]);
  });
});

describe("GET /applications/:id", () => {
  let applicationId: string;

  beforeEach(async () => {
    const application = await Application.create({
      userId,
      company: "Google",
      role: "SWE Intern",
      status: ApplicationStatus.APPLIED,
    });
    applicationId = (application._id as mongoose.Types.ObjectId).toString();
  });

  it("should return application by ID", async () => {
    const response = await request(app)
      .get(`/applications/${applicationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.company).toBe("Google");
  });

  it("should return 401 without token", async () => {
    await request(app).get(`/applications/${applicationId}`).expect(401);
  });

  it("should return 404 for non-existent ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await request(app)
      .get(`/applications/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });

  it("should return 400 for invalid ID format", async () => {
    await request(app)
      .get("/applications/invalid-id")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);
  });

  it("should not return other users application", async () => {
    // Create another user and their application
    const otherResponse = await request(app).post("/auth/register").send({
      email: "other@example.com",
      password: "password123",
    });

    const otherApp = await Application.create({
      userId: otherResponse.body.user.id,
      company: "Netflix",
      role: "SWE Intern",
      status: ApplicationStatus.APPLIED,
    });

    await request(app)
      .get(
        `/applications/${(otherApp._id as mongoose.Types.ObjectId).toString()}`,
      )
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });
});

describe("PUT /applications/:id", () => {
  let applicationId: string;

  beforeEach(async () => {
    const application = await Application.create({
      userId,
      company: "Google",
      role: "SWE Intern",
      status: ApplicationStatus.SAVED,
    });
    applicationId = (application._id as mongoose.Types.ObjectId).toString();
  });

  it("should update application", async () => {
    const response = await request(app)
      .put(`/applications/${applicationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        status: "APPLIED",
      })
      .expect(200);

    expect(response.body.status).toBe("APPLIED");
  });

  it("should return 401 without token", async () => {
    await request(app)
      .put(`/applications/${applicationId}`)
      .send({
        status: "APPLIED",
      })
      .expect(401);
  });

  it("should return 404 for non-existent ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await request(app)
      .put(`/applications/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        status: "APPLIED",
      })
      .expect(404);
  });

  it("should return 400 for invalid ID format", async () => {
    await request(app)
      .put("/applications/invalid-id")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        status: "APPLIED",
      })
      .expect(400);
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app)
      .put(`/applications/${applicationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "",
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
  });

  it("should not update other users application", async () => {
    const otherResponse = await request(app).post("/auth/register").send({
      email: "other@example.com",
      password: "password123",
    });

    const otherApp = await Application.create({
      userId: otherResponse.body.user.id,
      company: "Netflix",
      role: "SWE Intern",
      status: ApplicationStatus.SAVED,
    });

    await request(app)
      .put(
        `/applications/${(otherApp._id as mongoose.Types.ObjectId).toString()}`,
      )
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        status: "APPLIED",
      })
      .expect(404);
  });
});

describe("DELETE /applications/:id", () => {
  let applicationId: string;

  beforeEach(async () => {
    const application = await Application.create({
      userId,
      company: "Google",
      role: "SWE Intern",
      status: ApplicationStatus.SAVED,
    });
    applicationId = (application._id as mongoose.Types.ObjectId).toString();
  });

  it("should delete application", async () => {
    await request(app)
      .delete(`/applications/${applicationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    // Verify it's deleted
    const found = await Application.findById(applicationId);
    expect(found).toBeNull();
  });

  it("should return 401 without token", async () => {
    await request(app).delete(`/applications/${applicationId}`).expect(401);
  });

  it("should return 404 for non-existent ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await request(app)
      .delete(`/applications/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });

  it("should return 400 for invalid ID format", async () => {
    await request(app)
      .delete("/applications/invalid-id")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);
  });

  it("should not delete other users application", async () => {
    const otherResponse = await request(app).post("/auth/register").send({
      email: "other@example.com",
      password: "password123",
    });

    const otherApp = await Application.create({
      userId: otherResponse.body.user.id,
      company: "Netflix",
      role: "SWE Intern",
      status: ApplicationStatus.SAVED,
    });

    await request(app)
      .delete(
        `/applications/${(otherApp._id as mongoose.Types.ObjectId).toString()}`,
      )
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    // Verify it's not deleted
    const found = await Application.findById(otherApp._id);
    expect(found).not.toBeNull();
  });
});
