import request from "supertest";
import { createApp } from "../../app";
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
});

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  // Clear and register new user for each test
  await clearTestDatabase();

  const response = await request(app).post("/auth/register").send({
    email: "test@example.com",
    password: "password123",
  });

  accessToken = response.body.accessToken;
  userId = response.body.user.id;
});

describe("GET /applications", () => {
  beforeEach(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create test applications
    await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Google",
        role: "SWE Intern",
        status: "APPLIED",
      });

    await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Meta",
        role: "SWE Intern",
        status: "INTERVIEW",
      });

    await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Amazon",
        role: "SWE Intern",
        status: "SAVED",
        deadline: tomorrow.toISOString(),
      });
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
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "query.status",
        }),
      ]),
    );
  });

  it("should only return current users applications", async () => {
    // Create another user
    const otherResponse = await request(app).post("/auth/register").send({
      email: "other@example.com",
      password: "password123",
    });

    // Create application for other user
    await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${otherResponse.body.accessToken}`)
      .send({
        company: "Netflix",
        role: "SWE Intern",
        status: "APPLIED",
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

  it("should return 400 for missing required fields", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Stripe",
        // missing role
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
  });

  it("should accept optional fields", async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Stripe",
        role: "SWE Intern",
        status: "SAVED",
        location: "San Francisco, CA",
        link: "https://stripe.com/jobs",
        notes: "Found via referral",
        tags: ["referral", "priority"],
        deadline: deadline.toISOString(),
      })
      .expect(201);

    expect(response.body.location).toBe("San Francisco, CA");
    expect(response.body.link).toBe("https://stripe.com/jobs");
    expect(response.body.notes).toBe("Found via referral");
    expect(response.body.tags).toEqual(["referral", "priority"]);
  });
});

describe("GET /applications/:id", () => {
  let applicationId: string;

  beforeEach(async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Google",
        role: "SWE Intern",
        status: "SAVED",
      });

    applicationId = response.body.id;
  });

  it("should get application by id", async () => {
    const response = await request(app)
      .get(`/applications/${applicationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.company).toBe("Google");
  });

  it("should return 404 for non-existent application", async () => {
    await request(app)
      .get("/applications/non-existent-id")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });

  it("should return 401 without token", async () => {
    await request(app).get(`/applications/${applicationId}`).expect(401);
  });

  it("should not return application from different user", async () => {
    // Create another user
    const otherResponse = await request(app).post("/auth/register").send({
      email: "other@example.com",
      password: "password123",
    });

    await request(app)
      .get(`/applications/${applicationId}`)
      .set("Authorization", `Bearer ${otherResponse.body.accessToken}`)
      .expect(404);
  });
});

describe("PATCH /applications/:id", () => {
  let applicationId: string;

  beforeEach(async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Google",
        role: "SWE Intern",
        status: "SAVED",
      });

    applicationId = response.body.id;
  });

  it("should update application", async () => {
    const response = await request(app)
      .put(`/applications/${applicationId}`) // Use PUT not PATCH
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Google",
        role: "SWE Intern",
        status: "APPLIED",
        notes: "Submitted application",
      })
      .expect(200);

    expect(response.body.status).toBe("APPLIED");
    expect(response.body.notes).toBe("Submitted application");
  });

  it("should return 404 for non-existent application", async () => {
    await request(app)
      .put("/applications/non-existent-id") // Use PUT not PATCH
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Google",
        role: "SWE Intern",
        status: "APPLIED",
      })
      .expect(404);
  });

  it("should return 401 without token", async () => {
    await request(app)
      .put(`/applications/${applicationId}`) // Use PUT not PATCH
      .send({
        company: "Google",
        role: "SWE Intern",
        status: "APPLIED",
      })
      .expect(401);
  });
});

describe("DELETE /applications/:id", () => {
  let applicationId: string;

  beforeEach(async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Google",
        role: "SWE Intern",
        status: "SAVED",
      });

    applicationId = response.body.id;
  });

  it("should delete application", async () => {
    await request(app)
      .delete(`/applications/${applicationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    // Verify deletion
    await request(app)
      .get(`/applications/${applicationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });

  it("should return 404 for non-existent application", async () => {
    await request(app)
      .delete("/applications/non-existent-id")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });

  it("should return 401 without token", async () => {
    await request(app).delete(`/applications/${applicationId}`).expect(401);
  });
});
