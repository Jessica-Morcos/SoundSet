// src/__tests__/playlistRoutes.coverage.test.js
import request from "supertest";
import app from "../test-utils/server.js";

import "../test-db.js";

import User from "../models/User.js";
import Song from "../models/Song.js";
import Playlist from "../models/Playlist.js";

function makeToken(id, role) {
  return global.makeToken(id, role);
}

let user, dj, admin, userToken, djToken, adminToken;

beforeEach(async () => {
  await User.deleteMany();
  await Playlist.deleteMany();
  await Song.deleteMany();

  user = await User.create({
    username: "u1",
    passwordHash: "hash",
    role: "user",
    isActive: true
  });

  dj = await User.create({
    username: "dj1",
    passwordHash: "hash",
    role: "dj",
    isActive: true
  });

  admin = await User.create({
    username: "admin1",
    passwordHash: "hash",
    role: "admin",
    isActive: true
  });

  userToken = makeToken(user._id, "user");
  djToken = makeToken(dj._id, "dj");
  adminToken = makeToken(admin._id, "admin");
});

describe("Playlist Routes Coverage", () => {

  test("GET /api/playlist/debug/public returns playlists", async () => {
    await Playlist.create({
      name: "DebugTest",
      owner: dj._id,
      isPublic: true
    });

    const res = await request(app).get("/api/playlist/debug/public");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("PUT /:id/publish toggles public (admin)", async () => {
    const pl = await Playlist.create({
      name: "PubToggle",
      owner: dj._id,
      isPublic: false
    });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}/publish`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.playlist.isPublic).toBe(true);
  });

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

  test("PUT /:id updates playlist name", async () => {
    const pl = await Playlist.create({
      name: "OldName",
      owner: dj._id,
      songs: []
    });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${djToken}`)
      .send({ name: "NewName" });

    expect(res.status).toBe(200);
    expect(res.body.playlist.name).toBe("NewName");
  });

  test("POST /:id/add rejects missing songId", async () => {
    const pl = await Playlist.create({
      name: "AddFail",
      owner: dj._id,
      songs: []
    });

    const res = await request(app)
      .post(`/api/playlist/${pl._id}/add`)
      .set("Authorization", `Bearer ${djToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("songId is required");
  });

  test("POST /:id/add rejects song not found", async () => {
    const pl = await Playlist.create({
      name: "AddFail2",
      owner: dj._id,
      songs: []
    });

    const res = await request(app)
      .post(`/api/playlist/${pl._id}/add`)
      .set("Authorization", `Bearer ${djToken}`)
      .send({ songId: "65b1aaaaaa11111111111111" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Song not found");
  });

  test("POST /:id/add rejects if not owner", async () => {
    const s = await Song.create({ title: "X", durationSec: 10 });

    const pl = await Playlist.create({
      name: "NotOwner",
      owner: dj._id,
      songs: []
    });

    const res = await request(app)
      .post(`/api/playlist/${pl._id}/add`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ songId: s._id });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Unauthorized");
  });

});
