const request = require("supertest");
const app = require("../server");
const User = require("../models/User");
const mongoose = require("mongoose");

describe("Auth Endpoints", () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/finance-tracker-test"
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
      });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe("test@example.com");
    });

    it("should not register user with existing email", async () => {
      await User.create({
        username: "existing",
        email: "existing@example.com",
        password: "hashed",
      });

      const response = await request(app).post("/api/auth/register").send({
        username: "newuser",
        email: "existing@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
    });
  });
});
