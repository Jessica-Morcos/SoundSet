// src/__tests__/playlistRoutes.extraBranches.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import app from "../test-utils/server.js";

import "../test-db.js";

import User from "../models/User.js";
import Song from "../models/Song.js";
import Playlist from "../models/Playlist.js";

let owner;
let otherUser;
let ownerToken;
let otherToken;

function makeToken(id, role) {
  return global.makeToken(id, role);
}

beforeEach(async () => {
  await User.deleteMany();
  await Song.deleteMany();
  await Playlist.deleteMany();

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

  ownerToken = makeToken(owner._id, owner.role);
  otherToken = makeToken(otherUser._id, otherUser.role);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("playlistRoutes extra branches", () => {
  test("DELETE /api/playlist/:id returns 403 when non-owner tries to delete", async () => {
    const pl = await Playlist.create({
      name: "Owners List",
      owner: owner._id,
      songs: [],
      totalDurationSec: 0,
    });

    const res = await request(app)
      .delete(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("DELETE /api/playlist/:id handles database error (catch block)", async () => {
    const pl = await Playlist.create({
      name: "Boom List",
      owner: owner._id,
      songs: [],
      totalDurationSec: 0,
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

  test("PUT /api/playlist/:id returns 403 when non-owner tries to update", async () => {
    const pl = await Playlist.create({
      name: "Owners List",
      owner: owner._id,
      songs: [],
      totalDurationSec: 0,
    });

    const res = await request(app)
      .put(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ name: "Hacked Name" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("PUT /api/playlist/:id rejects update when new songs push playlist over 3 hours", async () => {
    // Two songs of 2 hours each => 4 hours total (> 3h)
    const s1 = await Song.create({
      title: "Long 1",
      durationSec: 2 * 60 * 60,
    });
    const s2 = await Song.create({
      title: "Long 2",
      durationSec: 2 * 60 * 60,
    });

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

  test("PUT /api/playlist/:id handles database error (catch block)", async () => {
    const pl = await Playlist.create({
      name: "Error Update",
      owner: owner._id,
      songs: [],
      totalDurationSec: 0,
    });

    jest
      .spyOn(Playlist, "findById")
      .mockRejectedValue(new Error("Update blew up"));

    const res = await request(app)
      .put(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Won't matter" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Update blew up");
  });

  test("POST /api/playlist/:id/add handles error in catch block", async () => {
    const pl = await Playlist.create({
      name: "Add Error",
      owner: owner._id,
      songs: [],
      totalDurationSec: 0,
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
