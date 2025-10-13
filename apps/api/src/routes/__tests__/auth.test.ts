import request from "supertest";
import { createApp } from "../../app";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from "../../__tests__/helpers/testDb";

const app = createApp();

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

afterEach(async () => {
  await clearTestDatabase();
});

describe("POST /auth/register", () => {
  it("should register new user and return 201 with tokens", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
      })
      .expect(201);

    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.id).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("should return 400 for invalid email", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        email: "invalid-email",
        password: "password123",
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("Invalid email format"),
        }),
      ]),
    );
  });

  it("should return 400 for short password", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "123",
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("at least 6 characters"),
        }),
      ]),
    );
  });

  it("should return 400 for missing email", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        password: "password123",
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "body.email",
        }),
      ]),
    );
  });

  it("should return 400 for duplicate email", async () => {
    // First registration
    await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
    });

    // Duplicate registration
    const response = await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password456",
      })
      .expect(400);

    expect(response.body.error).toBe("Email already registered");
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    // Register test user
    await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should login with correct credentials and return 200", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "password123",
      })
      .expect(200);

    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("should return 401 for incorrect password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword",
      })
      .expect(401);

    expect(response.body.error).toBe("Invalid credentials");
  });

  it("should return 401 for non-existent user", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: "password123",
      })
      .expect(401);

    expect(response.body.error).toBe("Invalid credentials");
  });

  it("should return 400 for missing credentials", async () => {
    await request(app).post("/auth/login").send({}).expect(400);
  });
});

describe("GET /auth/me", () => {
  let accessToken: string;

  beforeEach(async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
    });
    accessToken = response.body.accessToken;
  });

  it("should return current user with valid token", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.email).toBe("test@example.com");
    expect(response.body.id).toBeDefined();
  });

  it("should return 401 without token", async () => {
    const response = await request(app).get("/auth/me").expect(401);

    expect(response.body.error).toBe("No token provided");
  });

  it("should return 401 with invalid token", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  it("should return 401 with malformed Authorization header", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", "InvalidFormat token")
      .expect(401);

    expect(response.body.error).toBe("No token provided");
  });
});
