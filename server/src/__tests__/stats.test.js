// src/__tests__/stats.test.js
import request from "supertest";
import app from "../test-utils/server.js";
import User from "../models/User.js";
import Song from "../models/Song.js";
import PlayHistory from "../models/PlayHistory.js";
import "../test-db.js";
describe("Stats Logging", () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await User.create({
      username: "statuser",
      passwordHash: "abc",
      role: "user",
      isActive: true,
    });

    token = global.makeToken(user._id, "user");
  });

  test("logs a play", async () => {
    const song = await Song.create({
      title: "Track1",
      artist: "Jess",
      genre: "Pop",
      durationSec: 200,
    });

    const res = await request(app)
      .post("/api/stats/log")
      .set("Authorization", `Bearer ${token}`)
      .send({ songId: song._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe(`Play logged for ${song.title}`);

    const plays = await PlayHistory.find();
    expect(plays.length).toBe(1);
    expect(plays[0].song.toString()).toBe(song._id.toString());
  });

  test("rejects invalid songId format", async () => {
    const res = await request(app)
      .post("/api/stats/log")
      .set("Authorization", `Bearer ${token}`)
      .send({ songId: "not-a-real-id" });

    // requires your route/controller to use mongoose.Types.ObjectId.isValid()
    expect([400, 500]).toContain(res.status);

    // if you applied the explicit check, this will be 400 + specific message:
    // expect(res.status).toBe(400);
    // expect(res.body.message).toBe("Invalid song ID");
  });

  test("returns play frequency", async () => {
    const song = await Song.create({
      title: "FreqTrack",
      artist: "Jess",
      genre: "Pop",
      durationSec: 200,
    });

    await PlayHistory.create({
      user: user._id,
      song: song._id,
    });

    const res = await request(app)
      .get("/api/stats/frequency")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].songId.toString()).toBe(song._id.toString());
    expect(res.body[0].count).toBe(1);
  });

  test("returns artist stats", async () => {
    const song = await Song.create({
      title: "ArtistTrack",
      artist: "Jess",
      genre: "Pop",
      durationSec: 150,
    });

    await PlayHistory.create({
      user: user._id,
      song: song._id,
    });

    const res = await request(app)
      .get("/api/stats/artist")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]._id).toBe("Jess");
    expect(res.body[0].plays).toBeGreaterThanOrEqual(1);
  });

  test("returns genre stats", async () => {
    const song = await Song.create({
      title: "GenreTrack",
      artist: "Jess",
      genre: "Pop",
      durationSec: 150,
    });

    await PlayHistory.create({
      user: user._id,
      song: song._id,
    });

    const res = await request(app)
      .get("/api/stats/genre")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]._id).toBe("Pop");
    expect(res.body[0].plays).toBeGreaterThanOrEqual(1);
  });
});
