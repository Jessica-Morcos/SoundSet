import { jest } from "@jest/globals";
import request from "supertest";
import app from "../test-utils/server.js";
import "../test-db.js";

import User from "../models/User.js";
import Song from "../models/Song.js";
import Playlist from "../models/Playlist.js";

function makeToken(id, role) {
  return global.makeToken(id, role);
}

// 🔑 SHARED USERS + TOKENS
let user, dj, admin;
let userToken, djToken, adminToken;

// 🔑 EXTRA USERS FOR BRANCH TESTS
let owner, otherUser, ownerToken, otherToken;

beforeEach(async () => {
  await User.deleteMany();
  await Playlist.deleteMany();
  await Song.deleteMany();

  // === BASE USERS ===
  user = await User.create({
    username: "u1",
    passwordHash: "hash",
    role: "user",
    isActive: true,
  });

  dj = await User.create({
    username: "dj1",
    passwordHash: "hash",
    role: "dj",
    isActive: true,
  });

  admin = await User.create({
    username: "admin1",
    passwordHash: "hash",
    role: "admin",
    isActive: true,
  });

  userToken = makeToken(user._id, "user");
  djToken = makeToken(dj._id, "dj");
  adminToken = makeToken(admin._id, "admin");

  // === EXTRA BRANCH USERS ===
  owner = await User.create({
    username: "owneruser",
    passwordHash: "hash",
    role: "user",
    isActive: true,
  });

  otherUser = await User.create({
    username: "otheruser",
    passwordHash: "hash",
    role: "user",
    isActive: true,
  });

  ownerToken = makeToken(owner._id, "user");
  otherToken = makeToken(otherUser._id, "user");
});

afterEach(() => {
  jest.restoreAllMocks();
});

//
// =======================
//   PLAYLIST ROUTES CORE
// =======================
//

describe("Playlist Routes - Coverage + Branches", () => {

  // ---- GET PUBLIC DEBUG ----
  test("GET /api/playlist/debug/public returns playlists", async () => {
    await Playlist.create({
      name: "DebugTest",
      owner: dj._id,
      isPublic: true,
    });

    const res = await request(app).get("/api/playlist/debug/public");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---- PUBLISH TOGGLE ----
  test("PUT /:id/publish toggles public (admin only)", async () => {
    const pl = await Playlist.create({
      name: "PubToggle",
      owner: dj._id,
      isPublic: false,
    });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}/publish`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.playlist.isPublic).toBe(true);
  });
  
  test("PUT /:id/publish - regular user forbidden", async () => {
  const pl = await Playlist.create({
    name: "NoPublish",
    owner: dj._id,
    isPublic: false,
  });

  const res = await request(app)
    .put(`/api/playlist/${pl._id}/publish`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(res.status).toBe(403);
  expect(res.body.message).toBe("Only DJs or admins can publish playlists");
});


  // ---- DELETE OWNER SUCCESS ----
  test("DELETE /:id deletes playlist (owner only)", async () => {
    const pl = await Playlist.create({
      name: "DelTest",
      owner: dj._id,
    });

    const res = await request(app)
      .delete(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${djToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Playlist deleted successfully");
  });

  // ---- UPDATE NAME SUCCESS ----
  test("PUT /:id updates playlist name", async () => {
    const pl = await Playlist.create({
      name: "OldName",
      owner: dj._id,
      songs: [],
    });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${djToken}`)
      .send({ name: "NewName" });

    expect(res.status).toBe(200);
    expect(res.body.playlist.name).toBe("NewName");
  });

  // ---- ADD MISSING songId ----
  test("POST /:id/add rejects missing songId", async () => {
    const pl = await Playlist.create({
      name: "AddFail",
      owner: dj._id,
      songs: [],
    });

    const res = await request(app)
      .post(`/api/playlist/${pl._id}/add`)
      .set("Authorization", `Bearer ${djToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("songId is required");
  });

  // ---- ADD song not found ----
  test("POST /:id/add rejects song not found", async () => {
    const pl = await Playlist.create({
      name: "AddFail2",
      owner: dj._id,
      songs: [],
    });

    const res = await request(app)
      .post(`/api/playlist/${pl._id}/add`)
      .set("Authorization", `Bearer ${djToken}`)
      .send({ songId: "65b1aaaaaa11111111111111" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Song not found");
  });

  // ---- ADD not owner ----
  test("POST /:id/add rejects if not owner", async () => {
    const s = await Song.create({ title: "X", durationSec: 10 });

    const pl = await Playlist.create({
      name: "NotOwner",
      owner: dj._id,
      songs: [],
    });

    const res = await request(app)
      .post(`/api/playlist/${pl._id}/add`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ songId: s._id });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Unauthorized");
  });

  //
  // =======================
  //   EXTRA BRANCH COVERAGE
  // =======================
  //

  test("DELETE returns 403 when non-owner tries to delete", async () => {
    const pl = await Playlist.create({
      name: "Owners List",
      owner: owner._id,
      songs: [],
    });

    const res = await request(app)
      .delete(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("DELETE handles DB error (catch block)", async () => {
    const pl = await Playlist.create({
      name: "Boom List",
      owner: owner._id,
    });

    jest
      .spyOn(Playlist, "findById")
      .mockRejectedValue(new Error("DB delete error"));

    const res = await request(app)
      .delete(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("DB delete error");
  });

  test("PUT returns 403 when non-owner tries to update", async () => {
    const pl = await Playlist.create({
      name: "Owners List",
      owner: owner._id,
    });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ name: "Hacked Name" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("PUT rejects update when duration > 3 hours", async () => {
    const s1 = await Song.create({ title: "Long1", durationSec: 7200 });
    const s2 = await Song.create({ title: "Long2", durationSec: 7200 });

    const pl = await Playlist.create({
      name: "Needs Update",
      owner: owner._id,
      songs: [],
      totalDurationSec: 0,
    });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        songs: [
          { songId: s1._id.toString(), order: 0 },
          { songId: s2._id.toString(), order: 1 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Playlist duration must be between 0 and 3 hours."
    );
  });

  test("PUT handles DB error (catch block)", async () => {
    const pl = await Playlist.create({
      name: "Error Update",
      owner: owner._id,
    });

    jest
      .spyOn(Playlist, "findById")
      .mockRejectedValue(new Error("Update blew up"));

    const res = await request(app)
      .put(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Does not matter" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Update blew up");
  });

  test("POST /add handles DB error (catch block)", async () => {
    const pl = await Playlist.create({
      name: "Add Error",
      owner: owner._id,
    });

    jest
      .spyOn(Playlist, "findById")
      .mockRejectedValue(new Error("Add failed"));

    const res = await request(app)
      .post(`/api/playlist/${pl._id}/add`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ songId: "123456789012345678901234" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to add song");
  });
});
