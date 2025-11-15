// src/__tests__/songs.test.js
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../test-utils/server.js";
import "../test-db.js";
import User from "../models/User.js";
import Song from "../models/Song.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function makeToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    JWT_SECRET
  );
}

describe("Songs API", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await Song.deleteMany();
  });

  test("admin can toggle song restriction", async () => {
    const admin = await User.create({
      username: "adminuser",
      passwordHash: "fake-hash",
      role: "admin",
      isActive: true,
    });

    const token = makeToken(admin);

    // create song via API (POST /api/songs)
    const createRes = await request(app)
      .post("/api/songs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Song",
        artist: "Tester",
        genre: "Pop",
        durationSec: 120,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.song).toBeDefined();

    const songId = createRes.body.song._id;

    // toggle restricted flag via PATCH /api/songs/:id/toggle
    const toggleRes = await request(app)
      .patch(`/api/songs/${songId}/toggle`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.song).toBeDefined();
    expect(toggleRes.body.song.restricted).toBe(true);
  });
});
