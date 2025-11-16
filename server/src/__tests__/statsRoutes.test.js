/**
 * ORIGINAL FILE + ALL NEW TESTS ADDED
 * NOTHING REMOVED — ONLY SUCCESS TESTS + RESET LOGIC ADDED
 */

import { jest } from "@jest/globals";
import request from "supertest";
import app from "../test-utils/server.js";

import User from "../models/User.js";
import Song from "../models/Song.js";
import PlayHistory from "../models/PlayHistory.js";

import "../test-db.js";

describe("📈 Stats ROUTES (FULL COVERAGE EXTENSION)", () => {
  let user, token, songA, songB;

  beforeEach(async () => {
    await User.deleteMany();
    await Song.deleteMany();
    await PlayHistory.deleteMany();

    user = await User.create({
      username: "routeUser",
      passwordHash: "x",
      role: "user",
      isActive: true,
    });

    token = global.makeToken(user._id, "user");

    songA = await Song.create({
  title: "A",
  artist: "ArtistA",
  genre: "Pop",
  audioUrl: "x",
  durationSec: 120,
});

songB = await Song.create({
  title: "B",
  artist: "ArtistB",
  genre: "Rock",
  audioUrl: "x",
  durationSec: 200,
});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /* ------------------------------------------------------------------
   * ORIGINAL TESTS (kept exactly)
   * ------------------------------------------------------------------ */

  test("❌ /log returns 404 when song not found", async () => {
    const res = await request(app)
      .post("/api/stats/log")
      .set("Authorization", `Bearer ${token}`)
      .send({ songId: "507f1f77bcf86cd799439011" });

    expect(res.status).toBe(404);
  });

  test("💥 /log returns 500 on DB error", async () => {
    jest.spyOn(Song, "findById").mockRejectedValue(new Error("DB exploded"));

    const res = await request(app)
      .post("/api/stats/log")
      .set("Authorization", `Bearer ${token}`)
      .send({ songId: songA._id });

    expect(res.status).toBe(500);
  });

  test("💥 /artist returns 500 on DB error", async () => {
    jest.spyOn(PlayHistory, "aggregate").mockRejectedValue(new Error("agg"));
    const res = await request(app)
      .get("/api/stats/artist")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
  });

  test("💥 /genre returns 500 on DB error", async () => {
    jest.spyOn(PlayHistory, "aggregate").mockRejectedValue(new Error("agg"));
    const res = await request(app)
      .get("/api/stats/genre")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
  });

  /* ------------------------------------------------------------------
   * ✅ NEW REQUIRED TESTS (SUCCESS CASES)
   * ------------------------------------------------------------------ */

  test("✅ /log successfully logs a play", async () => {
    const res = await request(app)
      .post("/api/stats/log")
      .set("Authorization", `Bearer ${token}`)
      .send({ songId: songA._id });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain("Play logged");
  });

  test("📊 /frequency returns aggregated play counts", async () => {
    await PlayHistory.create({ user: user._id, song: songA._id });
    await PlayHistory.create({ user: user._id, song: songA._id });

    const res = await request(app)
      .get("/api/stats/frequency")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("count", 2);
    expect(res.body[0]).toHaveProperty("title", "A");
  });

  test("📊 /song/:id returns detailed song stats", async () => {
    await PlayHistory.create({ user: user._id, song: songA._id });
    await PlayHistory.create({ user: user._id, song: songA._id });

    const res = await request(app)
      .get(`/api/stats/song/${songA._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalPlays).toBe(2);
    expect(res.body.uniqueListeners).toBe(1);
  });

  test("📅 /song/:id/timeline returns daily timeline", async () => {
    await PlayHistory.create({ user: user._id, song: songA._id });
    await PlayHistory.create({ user: user._id, song: songA._id });

    const res = await request(app)
      .get(`/api/stats/song/${songA._id}/timeline`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("count");
    expect(res.body[0]).toHaveProperty("date");
  });

  /* ------------------------------------------------------------------
   * NEW FEATURE #3 — Recent Activity
   * ------------------------------------------------------------------ */
  test("👥 /users/recent returns list of user activities", async () => {
    await PlayHistory.create({ user: user._id, song: songA._id });

    const res = await request(app)
      .get("/api/stats/users/recent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("username", "routeUser");
    expect(res.body[0]).toHaveProperty("lastSongTitle", "A");
  });

  /* ------------------------------------------------------------------
   * ERROR BRANCH: /user/:userId/logs
   * ------------------------------------------------------------------ */
  test("💥 /user/:userId/logs returns 500 on DB error", async () => {
    jest.spyOn(PlayHistory, "find").mockReturnValue({
      populate: () => { throw new Error("fail"); }
    });

    const res = await request(app)
      .get(`/api/stats/user/${user._id}/logs`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
  });
});
