import request from "supertest";
import app from "../test-utils/server.js";

import User from "../models/User.js";
import "../test-db.js";

describe("Auth API", () => {
  beforeEach(async () => {
    await User.deleteMany();
  });

  test("registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "newuser",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered");
    expect(res.body.user.username).toBe("newuser");

    const user = await User.findOne({ username: "newuser" });
    expect(user).not.toBeNull();
  });

  test("rejects registration if username already exists", async () => {
    await User.create({
      username: "newuser",
      passwordHash: "abc",
    });

    const res = await request(app).post("/api/auth/register").send({
      username: "newuser",
      password: "test123",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Username already exists");
  });

  test("logs in a user with correct credentials", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("mypassword", 10);

    await User.create({
      username: "tester",
      passwordHash: hash,
      role: "user",
      isActive: true,
    });

    const res = await request(app).post("/api/auth/login").send({
      username: "tester",
      password: "mypassword",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.username).toBe("tester");
    expect(res.body.role).toBe("user");
  });

  test("rejects login for wrong password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("mypassword", 10);

    await User.create({
      username: "tester",
      passwordHash: hash,
    });

    const res = await request(app).post("/api/auth/login").send({
      username: "tester",
      password: "wrong",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("rejects login for inactive account", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("mypassword", 10);

    await User.create({
      username: "inactive",
      passwordHash: hash,
      isActive: false,
    });

    const res = await request(app).post("/api/auth/login").send({
      username: "inactive",
      password: "mypassword",
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Account deactivated. Please contact an admin.");
  });
});
