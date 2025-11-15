// src/__tests__/authMiddleware.full.test.js
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import {
  authMiddleware,
  roleCheck,
  adminOnly,
} from "../middleware/auth.js";

// Helper to mock req/res
function mockReqRes(overrides = {}) {
  const req = {
    headers: {},
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

  const next = jest.fn();

  return { req, res, next };
}

describe("🔐 AUTH MIDDLEWARE — 100% COVERAGE", () => {
  const SECRET = process.env.JWT_SECRET || "testsecret";

  let user;

  beforeAll(async () => {
    await User.deleteMany();

    user = await User.create({
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hash",
      role: "user",
    });
  });

  // ----------------------------------------------------
  // authMiddleware
  // ----------------------------------------------------
  test("authMiddleware returns 401 if no Authorization header", async () => {
    const { req, res, next } = mockReqRes();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData.message).toBe("No token");
    expect(next).not.toHaveBeenCalled();
  });

  test("authMiddleware returns 401 for invalid token", async () => {
    const { req, res, next } = mockReqRes({
      headers: { authorization: "Bearer faketoken" },
    });

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData.message).toBe("Invalid token");
    expect(next).not.toHaveBeenCalled();
  });

  test("authMiddleware returns 401 if user not found", async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();

  jest.spyOn(jwt, "verify").mockReturnValue({ id: fakeId });   // force valid decode
  jest.spyOn(User, "findById").mockResolvedValue(null);       // user not found

  const { req, res, next } = mockReqRes({
    headers: { authorization: "Bearer abc.def.ghi" },
  });

  await authMiddleware(req, res, next);

  expect(res.statusCode).toBe(401);
  expect(res.jsonData.message).toBe("User not found");
  expect(next).not.toHaveBeenCalled();
});



  test("authMiddleware calls next() and attaches req.user for valid token", async () => {
  const token = "valid.token.here";

  jest.spyOn(jwt, "verify").mockReturnValue({ id: user._id.toString() });
  jest.spyOn(User, "findById").mockResolvedValue(user);

  const { req, res, next } = mockReqRes({
    headers: { authorization: `Bearer ${token}` },
  });

  await authMiddleware(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(req.user._id.toString()).toBe(user._id.toString());
});


  // ----------------------------------------------------
  // roleCheck
  // ----------------------------------------------------
  test("roleCheck returns 403 if user's role is insufficient", async () => {
    const { req, res, next } = mockReqRes({
      user: { role: "user" },
    });

    const mw = roleCheck(["admin"]);

    await mw(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData.message).toBe("Access denied");
    expect(next).not.toHaveBeenCalled();
  });

  test("roleCheck allows access if role matches", async () => {
    const { req, res, next } = mockReqRes({
      user: { role: "admin" },
    });

    const mw = roleCheck(["admin"]);

    await mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // ----------------------------------------------------
  // adminOnly
  // ----------------------------------------------------
  test("adminOnly returns 403 when no user", async () => {
    const { req, res, next } = mockReqRes();

    await adminOnly(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData.message).toBe("Admin access only");
  });

  test("adminOnly returns 403 when user is not admin", async () => {
    const { req, res, next } = mockReqRes({
      user: { role: "user" },
    });

    await adminOnly(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData.message).toBe("Admin access only");
  });

  test("adminOnly calls next() when user is admin", async () => {
    const { req, res, next } = mockReqRes({
      user: { role: "admin" },
    });

    await adminOnly(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
