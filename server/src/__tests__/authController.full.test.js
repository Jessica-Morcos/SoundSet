import { jest } from "@jest/globals";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import authRoutes from "../routes/authRoutes.js";
import { getCurrentUser } from "../controllers/authController.js";

// ------------------------------------
// ⭐ REQUIRED MOCK REQ/RES HELPER ⭐
// ------------------------------------
function makeReqRes(overrides = {}) {
  const req = {
    headers: {},
    body: {},
    user: null,
    ...overrides,
  };

  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };

  return { req, res };
}

// ------------------------------------
// EXPRESS TEST APP
// ------------------------------------
const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

// helper to insert real hashed DB users
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

describe("🔐 AUTH CONTROLLER — 100% COVERAGE", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    jest.restoreAllMocks();
  });

  /* ----------------------------------------
     REGISTER USER
  ---------------------------------------- */
  test("registers a user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "jess", password: "pass123" });

    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe("jess");
  });

  test("rejects duplicate username", async () => {
    await createUser("jess", "pass123");

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "jess", password: "newpass" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Username already exists");
  });

  test("register returns 500 if DB fails", async () => {
    jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("DB FAIL"));

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "boom", password: "x" });

    expect(res.status).toBe(500);
    expect(res.body.message).toContain("DB FAIL");
  });

  /* ----------------------------------------
     LOGIN USER
  ---------------------------------------- */
  test("login success", async () => {
    await createUser("jess", "pass123");

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "jess", password: "pass123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.username).toBe("jess");
  });

  test("login fails with wrong password", async () => {
    await createUser("jess", "pass123");

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "jess", password: "wrongpw" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("login fails when user not found", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "ghost", password: "abc" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  test("login rejects deactivated user", async () => {
    await createUser("inactiveUser", "pass123", { isActive: false });

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "inactiveUser", password: "pass123" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("deactivated");
  });

  test("login returns 500 if bcrypt throws", async () => {
    await createUser("boom", "pass123");

    jest.spyOn(bcrypt, "compare").mockRejectedValueOnce(new Error("HASH_FAIL"));

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "boom", password: "pass123" });

    expect(res.status).toBe(500);
    expect(res.body.message).toContain("HASH_FAIL");
  });

  /* ----------------------------------------
     GET CURRENT USER (ERROR PATH!)
  ---------------------------------------- */
  test("getCurrentUser returns 500 on DB error", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const { req, res } = makeReqRes({ user: { _id: userId } });

    jest.spyOn(User, "findById").mockImplementationOnce(() => {
      throw new Error("DB explode");
    });

    await getCurrentUser(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.message).toContain("DB explode");
  });
  test("getCurrentUser returns user successfully", async () => {
  const created = await createUser("liveuser", "pass123");

  // Create a valid JWT manually
  const jwt = await import("jsonwebtoken");
  const token = jwt.default.sign(
    { id: created._id, role: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const res = await request(app)
    .get("/auth/me")
    .set("Authorization", `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.username).toBe("liveuser");
});

});
