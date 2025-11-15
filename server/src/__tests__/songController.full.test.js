// src/__tests__/songController.full.test.js
import request from "supertest";
import app from "../test-utils/server.js";
import "../test-db.js";

import User from "../models/User.js";
import Song from "../models/Song.js";

let admin, user;
let adminToken, userToken;

function makeToken(id, role) {
  return global.makeToken(id, role);
}

beforeEach(async () => {
  await User.deleteMany();
  await Song.deleteMany();

  admin = await User.create({
    username: "admin",
    passwordHash: "x",
    role: "admin",
    preferences: { genres: [], bands: [], years: [] },
  });

  user = await User.create({
    username: "regular",
    passwordHash: "x",
    role: "user",
    preferences: { genres: [], bands: [], years: [] },
    history: [],
  });

  adminToken = makeToken(admin._id, "admin");
  userToken = makeToken(user._id, "user");
});

describe("🎵 SONG CONTROLLER — FULL 100% COVERAGE", () => {

  // ---------------------------------------------------------
  // listSongs
  // ---------------------------------------------------------
  test("listSongs hides restricted from users", async () => {
    await Song.create({ title: "A", restricted: false, durationSec: 100 });
    await Song.create({ title: "B", restricted: true, durationSec: 100 });

    const res = await request(app)
      .get("/api/songs")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("A");
  });

  test("admin sees all songs including restricted", async () => {
    await Song.create({ title: "A", restricted: false, durationSec: 100 });
    await Song.create({ title: "B", restricted: true, durationSec: 100 });

    const res = await request(app)
      .get("/api/songs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.body.length).toBe(2);
  });

  test("listSongs filters by genre, year, q", async () => {
    await Song.create({
      title: "Hello",
      genre: "pop",
      year: 2020,
      durationSec: 100,
    });

    await Song.create({
      title: "World",
      genre: "rock",
      year: 2010,
      durationSec: 100,
    });

    const res = await request(app)
      .get("/api/songs?genre=pop&year=2020&q=Hell")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Hello");
  });

  // ---------------------------------------------------------
  // createSong
  // ---------------------------------------------------------
  test("admin can create song", async () => {
    const res = await request(app)
      .post("/api/songs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "NewSong",
        artist: "Artist",
        durationSec: 200,
      });

    expect(res.status).toBe(201);
    expect(res.body.song.title).toBe("NewSong");
  });

  // ---------------------------------------------------------
  // updateSong
  // ---------------------------------------------------------
  test("updateSong successfully updates", async () => {
    const s = await Song.create({ title: "Old", durationSec: 100 });

    const res = await request(app)
      .put(`/api/songs/${s._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.song.title).toBe("Updated");
  });

  test("updateSong returns 404 if song not found", async () => {
    const fake = "65abcabcabcabcabcabcabc1";

    const res = await request(app)
      .put(`/api/songs/${fake}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Nope" });

    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------
  // toggleRestricted
  // ---------------------------------------------------------
  test("toggleRestricted flips boolean", async () => {
    const s = await Song.create({ title: "X", restricted: false, durationSec: 100 });

    const res = await request(app)
      .patch(`/api/songs/${s._id}/toggle`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.song.restricted).toBe(true);
  });

  test("toggleRestricted returns 404", async () => {
    const fake = "65abcabcabcabcabcabcabc1";

    const res = await request(app)
      .patch(`/api/songs/${fake}/toggle`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------
  // deleteSong
  // ---------------------------------------------------------
  test("deleteSong removes song", async () => {
    const s = await Song.create({ title: "Y", durationSec: 100 });

    const res = await request(app)
      .delete(`/api/songs/${s._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const check = await Song.findById(s._id);
    expect(check).toBeNull();
  });

  test("deleteSong returns 404", async () => {
    const fake = "65abcabcabcabcabcabcabc1";

    const res = await request(app)
      .delete(`/api/songs/${fake}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------
  // suggestSongs
  // ---------------------------------------------------------
  test("suggestSongs returns 401 if user not found (middleware user check)", async () => {
    const ghostToken = makeToken("65abcabcabcabcabcabcabc1", "user");

    const res = await request(app)
      .get("/api/songs/suggest")
      .set("Authorization", `Bearer ${ghostToken}`);

    expect(res.status).toBe(401);
  });

  test("suggestSongs returns songs based on history + preferences", async () => {
    const s1 = await Song.create({
      title: "PopHit",
      genre: "pop",
      artist: "A1",
      year: 2020,
      restricted: false,
      durationSec: 100,
    });

    await Song.create({
      title: "RockHit",
      genre: "rock",
      artist: "B1",
      year: 2021,
      restricted: false,
      durationSec: 100,
    });

    user.history = [
      { song: s1._id, count: 5, playedAt: new Date() },
    ];
    user.preferences = { genres: ["pop"], bands: ["A1"], years: [2020] };
    await user.save();

    const res = await request(app)
      .get("/api/songs/suggest")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].title).toBe("PopHit");
  });

  test("suggestSongs fills missing results with random sampling", async () => {
    await Song.create({ title: "S1", genre: "pop", restricted: false, durationSec: 100 });
    await Song.create({ title: "S2", genre: "rock", restricted: false, durationSec: 100 });
    await Song.create({ title: "S3", genre: "jazz", restricted: false, durationSec: 100 });

    const res = await request(app)
      .get("/api/songs/suggest?limit=3")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });
});
