// src/__tests__/djs.test.js
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../test-utils/server.js";
import "../test-db.js";
import User from "../models/User.js";
import DjProfile from "../models/DjProfile.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function makeToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    JWT_SECRET
  );
}

describe("DJ API", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await DjProfile.deleteMany();
  });

  test("creates a new DJ profile", async () => {
    const dj = await User.create({
      username: "djuser",
      passwordHash: "fake-hash",
      role: "dj",
      isActive: true,
    });

    const token = makeToken(dj);

    // your route: POST /api/dj  (not /profile)
    const res = await request(app)
      .post("/api/dj")
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "DJ Max",
        bio: "Test bio",
        genres: ["house"],
        experienceLevel: "intermediate",
      });

    expect(res.status).toBe(201);
    expect(res.body.profile).toBeDefined();
    expect(res.body.profile.displayName).toBe("DJ Max");

    const profileInDb = await DjProfile.findOne({ user: dj._id });
    expect(profileInDb).not.toBeNull();
    expect(profileInDb.displayName).toBe("DJ Max");
  });

  test("lists all DJs", async () => {
    const dj = await User.create({
      username: "listdj",
      passwordHash: "fake-hash",
      role: "dj",
      isActive: true,
    });

    await DjProfile.create({
      user: dj._id,
      displayName: "List DJ",
      bio: "List bio",
      genres: ["pop"],
      experienceLevel: "beginner",
    });

    const res = await request(app).get("/api/dj");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].displayName).toBe("List DJ");
  });
});
