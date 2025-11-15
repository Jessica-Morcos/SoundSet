// src/__tests__/playlists.test.js
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../test-utils/server.js";
import "../test-db.js"; // connects to test Mongo
import User from "../models/User.js";
import Playlist from "../models/Playlist.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function makeToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    JWT_SECRET
  );
}

describe("Playlist API", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await Playlist.deleteMany();
  });

  test("DJ can toggle playlist public/private", async () => {
    // create DJ user directly in DB
    const dj = await User.create({
      username: "djuser",
      passwordHash: "fake-hash",
      role: "dj",
      isActive: true,
    });

    const token = makeToken(dj);

    // create playlist via API using DJ token
    const createRes = await request(app)
      .post("/api/playlist")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Toggle Me" });

    // your controller returns the playlist object directly
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe("Toggle Me");

    const playlistId = createRes.body._id;

    // toggle publish
    const toggleRes = await request(app)
      .put(`/api/playlist/${playlistId}/publish`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.playlist).toBeDefined();
    expect(toggleRes.body.playlist.isPublic).toBe(true);
  });

  test("user cannot publish playlist", async () => {
    // create DJ + playlist
    const dj = await User.create({
      username: "djowner",
      passwordHash: "fake-hash",
      role: "dj",
      isActive: true,
    });

    const playlist = await Playlist.create({
      name: "Private List",
      owner: dj._id,
      songs: [],
      totalDurationSec: 0,
      classification: "general",
      isPublic: false,
    });

    // create regular user
    const user = await User.create({
      username: "normaluser",
      passwordHash: "fake-hash",
      role: "user",
      isActive: true,
    });

    const token = makeToken(user);

    // regular user tries to publish
    const res = await request(app)
      .put(`/api/playlist/${playlist._id.toString()}/publish`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    // playlist exists, but role is not dj/admin → 403
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Only DJs or admins can publish playlists");
  });
});
