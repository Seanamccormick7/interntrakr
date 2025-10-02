import mongoose from "mongoose";
import { User } from "../User";

// Test database setup
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
});

describe("User Model", () => {
  // Ensure indexes are created before running index tests
  beforeAll(async () => {
    await User.init(); // This creates all indexes
  });

  describe("Validation", () => {
    it("should create a valid user", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      const user = await User.create(userData);

      expect(user.email).toBe("test@example.com");
      expect(user.password).toBe("password123");
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it("should require email", async () => {
      const user = new User({ password: "password123" });

      await expect(user.save()).rejects.toThrow();
    });

    it("should require password", async () => {
      const user = new User({ email: "test@example.com" });

      await expect(user.save()).rejects.toThrow();
    });

    it("should enforce unique email", async () => {
      await User.create({
        email: "test@example.com",
        password: "password123",
      });

      await expect(
        User.create({
          email: "test@example.com",
          password: "password456",
        }),
      ).rejects.toThrow();
    });

    it("should validate email format", async () => {
      const user = new User({
        email: "invalid-email",
        password: "password123",
      });

      await expect(user.save()).rejects.toThrow(/valid email/);
    });

    it("should enforce minimum password length", async () => {
      const user = new User({
        email: "test@example.com",
        password: "123",
      });

      await expect(user.save()).rejects.toThrow(/at least 6 characters/);
    });

    it("should convert email to lowercase", async () => {
      const user = await User.create({
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      });

      expect(user.email).toBe("test@example.com");
    });

    it("should trim email whitespace", async () => {
      const user = await User.create({
        email: "  test@example.com  ",
        password: "password123",
      });

      expect(user.email).toBe("test@example.com");
    });
  });

  describe("Indexes", () => {
    it("should have email index from unique constraint", async () => {
      const indexes = await User.collection.getIndexes();
      // Email index exists due to unique: true in schema
      const emailIndex = Object.keys(indexes).find((key) =>
        key.includes("email"),
      );

      expect(emailIndex).toBeDefined();
    });

    it("should have createdAt index", async () => {
      const indexes = await User.collection.getIndexes();
      const createdAtIndex = Object.keys(indexes).find((key) =>
        key.includes("createdAt"),
      );

      expect(createdAtIndex).toBeDefined();
    });
  });

  describe("Security", () => {
    it("should not return password in toJSON", async () => {
      const user = await User.create({
        email: "test@example.com",
        password: "password123",
      });

      const json = user.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.email).toBe("test@example.com");
    });

    it("should not select password by default", async () => {
      await User.create({
        email: "test@example.com",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });

      expect(user?.password).toBeUndefined();
    });

    it("should select password when explicitly requested", async () => {
      await User.create({
        email: "test@example.com",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" }).select(
        "+password",
      );

      expect(user?.password).toBe("password123");
    });
  });

  describe("Timestamps", () => {
    it("should auto-generate createdAt and updatedAt", async () => {
      const user = await User.create({
        email: "test@example.com",
        password: "password123",
      });

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("should update updatedAt on modification", async () => {
      const user = await User.create({
        email: "test@example.com",
        password: "password123",
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      user.email = "updated@example.com";
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });
});
