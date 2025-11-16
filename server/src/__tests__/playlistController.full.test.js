// src/__tests__/playlistController.full.test.js
import request from "supertest";
import app from "../test-utils/server.js";

import "../test-db.js";

import User from "../models/User.js";
import Song from "../models/Song.js";
import Playlist from "../models/Playlist.js";

let dj, user, admin;
let djToken, userToken, adminToken;

function makeToken(id, role) {
  return global.makeToken(id, role);
}

beforeEach(async () => {
  await User.deleteMany();
  await Song.deleteMany();
  await Playlist.deleteMany();

  dj = await User.create({
    username: "dj",
    passwordHash: "x",
    role: "dj",
    isActive: true,
  });

  user = await User.create({
    username: "user",
    passwordHash: "x",
    role: "user",
    isActive: true,
  });

  admin = await User.create({
    username: "admin",
    passwordHash: "x",
    role: "admin",
    isActive: true,
  });

  djToken = makeToken(dj._id, "dj");
  userToken = makeToken(user._id, "user");
  adminToken = makeToken(admin._id, "admin");
});

describe("🎵 PLAYLIST CONTROLLER — FULL 100% COVERAGE", () => {

  test("creates empty playlist", async () => {
    const res = await request(app)
      .post("/api/playlist")
      .set("Authorization", `Bearer ${djToken}`)
      .send({ name: "Empty" });

    expect(res.status).toBe(201);
    expect(res.body.songs.length).toBe(0);
  });

  test("creates playlist between 1–3 hrs", async () => {
    const s = await Song.create({ title: "Medium", durationSec: 4000 });

    const res = await request(app)
      .post("/api/playlist")
      .set("Authorization", `Bearer ${djToken}`)
      .send({
        name: "Valid",
        songs: [{ songId: s._id }],
      });

    expect(res.status).toBe(201);
    expect(res.body.totalDurationSec).toBe(4000);
  });

  test("rejects playlist > 3 hrs", async () => {
    const s = await Song.create({
      title: "Long",
      durationSec: 4 * 3600,
    });

    const res = await request(app)
      .post("/api/playlist")
      .set("Authorization", `Bearer ${djToken}`)
      .send({
        name: "TooLong",
        songs: [{ songId: s._id }],
      });

    expect(res.status).toBe(400);
  });

  // GET MY PLAYLISTS
  test("getMyPlaylists returns correct owner playlists", async () => {
    await Playlist.create({ name: "P1", owner: dj._id });
    await Playlist.create({ name: "P2", owner: user._id });

    const res = await request(app)
      .get("/api/playlist/mine")
      .set("Authorization", `Bearer ${djToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("P1");
  });

  // TOGGLE PUBLIC
  test("admin toggles any playlist", async () => {
    const pl = await Playlist.create({ name: "AdminPL", owner: dj._id });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}/publish`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.playlist.isPublic).toBe(true);
  });

  test("DJ toggles own playlist", async () => {
    const pl = await Playlist.create({ name: "Own", owner: dj._id });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}/publish`)
      .set("Authorization", `Bearer ${djToken}`);

    expect(res.status).toBe(200);
  });

  test("DJ cannot toggle others playlist", async () => {
    const pl = await Playlist.create({ name: "Other", owner: user._id });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}/publish`)
      .set("Authorization", `Bearer ${djToken}`);

    expect(res.status).toBe(403);
  });

  test("user cannot publish playlist", async () => {
    const pl = await Playlist.create({ name: "Denied", owner: dj._id });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}/publish`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  // CLONE
  test("clone playlist success", async () => {
    const source = await Playlist.create({
      name: "Source",
      owner: dj._id,
      isPublic: true,
      songs: [],
      totalDurationSec: 1234,
    });

    const res = await request(app)
      .post(`/api/playlist/${source._id}/clone`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(201);
    expect(res.body.playlist.name).toBe("Source (Copy)");
  });

  test("clone fails if not found", async () => {
    const res = await request(app)
      .post("/api/playlist/65aaaaaaaaaaaaaaaaaaaaaa/clone")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  test("clone fails if private", async () => {
    const p = await Playlist.create({
      name: "Private",
      owner: dj._id,
      isPublic: false,
    });

    const res = await request(app)
      .post(`/api/playlist/${p._id}/clone`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  test("clone fails if already added", async () => {
    const p = await Playlist.create({
      name: "PublicList",
      owner: dj._id,
      isPublic: true,
    });

    await Playlist.create({
      name: "PublicList (Copy)",
      owner: user._id,
    });

    const res = await request(app)
      .post(`/api/playlist/${p._id}/clone`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(400);
  });

  // GET BY ID
  test("get public playlist succeeds", async () => {
    const pl = await Playlist.create({
      name: "Public",
      owner: dj._id,
      isPublic: true,
    });

    const res = await request(app)
      .get(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
  });

  test("get private playlist fails if not owner", async () => {
    const pl = await Playlist.create({
      name: "PrivatePL",
      owner: dj._id,
      isPublic: false,
    });

    const res = await request(app)
      .get(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  test("restricted songs filtered out", async () => {
    const s1 = await Song.create({ title: "Good", durationSec: 100, restricted: false });
    const s2 = await Song.create({ title: "Bad", durationSec: 100, restricted: true });

    const pl = await Playlist.create({
      name: "Filter",
      owner: dj._id,
      isPublic: true,
      songs: [
        { song: s1._id, order: 0 },
        { song: s2._id, order: 1 },
      ],
    });

    const res = await request(app)
      .get(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.songs.length).toBe(1);
    expect(res.body.songs[0].song.title).toBe("Good");
  });

  test("returns 404 for nonexistent playlist", async () => {
    const res = await request(app)
      .get("/api/playlist/65aabcabcabcabcabcabcabc")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  // PUBLIC LISTS
  test("listPublicPlaylists returns only public playlists sorted", async () => {
    await Playlist.create({
      name: "Old",
      owner: dj._id,
      isPublic: true,
      createdAt: new Date("2022-01-01"),
    });

    await Playlist.create({
      name: "New",
      owner: dj._id,
      isPublic: true,
      createdAt: new Date("2023-01-01"),
    });

    const res = await request(app).get("/api/playlist/discover");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].name).toBe("New");
  });
});