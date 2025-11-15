import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });


import request from "supertest";
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import authRoutes from "../routes/authRoutes.js";

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

// helper to make real hashed users
const createUser = async (username, password, overrides = {}) => {
  const hash = await bcrypt.hash(password, 10);
  return User.create({
    username,
    passwordHash: hash,
    role: "user",
    isActive: true,
    ...overrides,
  });
};

describe("🔐 AUTH CONTROLLER — FULL COVERAGE", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  /* ----------------------------------------
     REGISTER USER
  ---------------------------------------- */
  test("registers user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        username: "jess",
        password: "pass123",
      });

    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe("jess");
  });

  test("rejects duplicate username", async () => {
    await createUser("jess", "pass123");

    const res = await request(app)
      .post("/auth/register")
      .send({
        username: "jess",
        password: "newpass",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Username already exists");
  });

  /* ----------------------------------------
     LOGIN USER
  ---------------------------------------- */
  test("login success", async () => {
    await createUser("jess", "pass123");

    const res = await request(app)
      .post("/auth/login")
      .send({
        username: "jess",
        password: "pass123",
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.username).toBe("jess");
  });

  test("login fails with wrong password", async () => {
    await createUser("jess", "pass123");

    const res = await request(app)
      .post("/auth/login")
      .send({
        username: "jess",
        password: "wrongpw",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("login fails when user does not exist", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        username: "ghost",
        password: "abc",
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  /* ----------------------------------------
     REJECT DEACTIVATED ACCOUNTS
  ---------------------------------------- */
  test("login rejects deactivated users", async () => {
    await createUser("inactiveUser", "pass123", { isActive: false });

    const res = await request(app)
      .post("/auth/login")
      .send({
        username: "inactiveUser",
        password: "pass123",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("deactivated");
  });
});
