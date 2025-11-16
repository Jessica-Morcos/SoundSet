// src/__tests__/userController.full.test.js
import { jest } from "@jest/globals";
import "../test-db.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import {
  listUsers,
  toggleUserActive,
  deleteUser,
  getPreferences,
  updatePreferences,
  promoteUser,
} from "../controllers/userController.js";

// helper to create mock req/res
function makeReqRes(reqOverrides = {}, resOverrides = {}) {
  const req = {
    user: null,
    params: {},
    body: {},
    ...reqOverrides,
  };

  const res = {
    statusCode: 200,
    jsonData: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
    ...resOverrides,
  };

  return { req, res };
}

describe("👤 USER CONTROLLER — FULL COVERAGE", () => {
  let adminUser;
  let regularUser;

  beforeEach(async () => {
    await User.deleteMany();

    adminUser = await User.create({
      username: "admin",
      passwordHash: "hash",
      role: "admin",
      isActive: true,
    });

    regularUser = await User.create({
      username: "regular",
      passwordHash: "hash",
      role: "user",
      isActive: false,
      preferences: { genres: [], bands: [], years: [] },
    });
  });

  // ---------------- listUsers ----------------
  test("listUsers returns 403 for non-admin", async () => {
    const { req, res } = makeReqRes({ user: { role: "user" } });
    await listUsers(req, res);
    expect(res.statusCode).toBe(403);
  });

  test("listUsers returns all users for admin and hides passwordHash", async () => {
    const { req, res } = makeReqRes({ user: { role: "admin" } });
    await listUsers(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.jsonData)).toBe(true);
    expect(res.jsonData.length).toBe(2);
    // after .select("-passwordHash") we should not see passwordHash
    res.jsonData.forEach((u) => {
      expect(u.passwordHash).toBeUndefined();
    });
  });

  // ---------------- toggleUserActive ----------------
  test("toggleUserActive returns 403 for non-admin", async () => {
    const { req, res } = makeReqRes({
      user: { role: "user" },
      params: { id: regularUser._id.toString() },
    });

    await toggleUserActive(req, res);
    expect(res.statusCode).toBe(403);
  });

  test("toggleUserActive returns 404 if user not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { req, res } = makeReqRes({
      user: { role: "admin" },
      params: { id: fakeId },
    });

    await toggleUserActive(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.message).toBe("User not found");
  });

  test("toggleUserActive flips isActive and returns message", async () => {
    const { req, res } = makeReqRes({
      user: { role: "admin" },
      params: { id: regularUser._id.toString() },
    });

    await toggleUserActive(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.user.isActive).toBe(true);
    expect(res.jsonData.message).toBe("User activated");

    const refreshed = await User.findById(regularUser._id);
    expect(refreshed.isActive).toBe(true);
  });

  // ---------------- deleteUser ----------------
  test("deleteUser returns 403 for non-admin", async () => {
    const { req, res } = makeReqRes({
      user: { role: "user" },
      params: { id: regularUser._id.toString() },
    });

    await deleteUser(req, res);
    expect(res.statusCode).toBe(403);
  });

  test("deleteUser returns 404 when user not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { req, res } = makeReqRes({
      user: { role: "admin" },
      params: { id: fakeId },
    });

    await deleteUser(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.message).toBe("User not found");
  });

  test("deleteUser deletes user successfully", async () => {
    const { req, res } = makeReqRes({
      user: { role: "admin" },
      params: { id: regularUser._id.toString() },
    });

    await deleteUser(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.message).toBe("User deleted successfully");

    const exists = await User.findById(regularUser._id);
    expect(exists).toBeNull();
  });

  // ---------------- getPreferences ----------------
  test("getPreferences returns default empty prefs when none set", async () => {
    const { req, res } = makeReqRes({ user: { _id: regularUser._id } });

    await getPreferences(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ genres: [], bands: [], years: [] });
  });

  test("getPreferences returns 404 if user not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { req, res } = makeReqRes({ user: { _id: fakeId } });

    await getPreferences(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.message).toBe("User not found");
  });

  test("getPreferences returns 500 on database error", async () => {
    const original = User.findById;
    User.findById = jest.fn(() => {
      throw new Error("DB error");
    });

    const { req, res } = makeReqRes({ user: { _id: regularUser._id } });

    await getPreferences(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.message).toBe("DB error");

    User.findById = original;
  });

  // ---------------- updatePreferences ----------------
  test("updatePreferences returns 404 if user not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { req, res } = makeReqRes({
      user: { _id: fakeId },
      body: {
        genres: ["rock"],
        bands: ["Band"],
        years: [2000],
      },
    });

    await updatePreferences(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.message).toBe("User not found");
  });

  test("updatePreferences updates preferences and casts years to numbers", async () => {
    const { req, res } = makeReqRes({
      user: { _id: regularUser._id },
      body: {
        genres: ["pop", "rnb"],
        bands: ["Adele"],
        years: ["2010", 2011],
      },
    });

    await updatePreferences(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.message).toBe("Preferences updated successfully");
    expect(res.jsonData.preferences).toEqual({
      genres: ["pop", "rnb"],
      bands: ["Adele"],
      years: [2010, 2011],
    });

    const refreshed = await User.findById(regularUser._id);
    expect(refreshed.preferences.years).toEqual([2010, 2011]);
  });

  test("updatePreferences handles missing arrays and defaults to empty", async () => {
    const { req, res } = makeReqRes({
      user: { _id: regularUser._id },
      body: {},
    });

    await updatePreferences(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.preferences).toEqual({
      genres: [],
      bands: [],
      years: [],
    });
  });

  test("updatePreferences returns 500 on database error", async () => {
    const original = User.findById;
    User.findById = jest.fn(() => {
      throw new Error("Prefs failure");
    });

    const { req, res } = makeReqRes({
      user: { _id: regularUser._id },
      body: { genres: ["x"], bands: ["y"], years: [2000] },
    });

    await updatePreferences(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.message).toBe("Prefs failure");

    User.findById = original;
  });
  // ---------------- promoteUser (NEW FEATURE) ----------------
describe("🔼 promoteUser — ROLE TOGGLING", () => {
  test("returns 403 if non-admin calls promoteUser", async () => {
    const { req, res } = makeReqRes({
      user: { role: "user" },
      params: { id: regularUser._id.toString() },
    });

    await promoteUser(req, res);
    expect(res.statusCode).toBe(403);
  });

  test("returns 404 if target user does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { req, res } = makeReqRes({
      user: { role: "admin" },
      params: { id: fakeId },
    });

    await promoteUser(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.message).toBe("User not found");
  });

  test("DJ → becomes ADMIN", async () => {
    const dj = await User.create({
      username: "djtester",
      passwordHash: "x",
      role: "dj",
    });

    const { req, res } = makeReqRes({
      user: { role: "admin" },
      params: { id: dj._id.toString() },
    });

    await promoteUser(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.user.role).toBe("admin");

    const refreshed = await User.findById(dj._id);
    expect(refreshed.role).toBe("admin");
  });

  test("ADMIN → becomes DJ on second toggle", async () => {
    const djAdmin = await User.create({
      username: "adminDJ",
      passwordHash: "x",
      role: "admin",
    });

    const { req, res } = makeReqRes({
      user: { role: "admin" },
      params: { id: djAdmin._id.toString() },
    });

    await promoteUser(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.user.role).toBe("dj");
  });

  test("❌ User cannot become Admin directly", async () => {
    const { req, res } = makeReqRes({
      user: { role: "admin" },
      params: { id: regularUser._id.toString() },
    });

    await promoteUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.message).toMatch(/must become DJs/i);

    const refreshed = await User.findById(regularUser._id);
    expect(refreshed.role).toBe("user");
  });
});

});
