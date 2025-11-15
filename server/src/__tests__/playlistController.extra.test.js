// src/__tests__/playlistController.extra.test.js
import request from "supertest";
import app from "../test-utils/server.js";

import "../test-db.js";

import User from "../models/User.js";
import Song from "../models/Song.js";
import Playlist from "../models/Playlist.js";

let djToken, userToken, adminToken, dj, user, admin;

// Helper to make JWT tokens from testSetup.js
function makeToken(id, role) {
  return global.makeToken(id, role);
}

beforeEach(async () => {
  await User.deleteMany();
  await Song.deleteMany();
  await Playlist.deleteMany();

  dj = await User.create({
    username: "djuser",
    passwordHash: "hash",
    role: "dj",
    isActive: true,
  });

  user = await User.create({
    username: "normaluser",
    passwordHash: "hash",
    role: "user",
    isActive: true,
  });

  admin = await User.create({
    username: "adminuser",
    passwordHash: "hash",
    role: "admin",
    isActive: true,
  });

  djToken = makeToken(dj._id, "dj");
  userToken = makeToken(user._id, "user");
  adminToken = makeToken(admin._id, "admin");
});

describe("Playlist Controller – Extended Coverage", () => {
  test("rejects playlist creation over 3 hours", async () => {
    const longSong = await Song.create({
      title: "LongTrack",
      durationSec: 4 * 60 * 60,
    });

    const res = await request(app)
      .post("/api/playlist")
      .set("Authorization", `Bearer ${djToken}`)
      .send({
        name: "Too Long",
        songs: [{ songId: longSong._id, order: 0 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Playlist must be between 1 and 3 hours.");
  });

  test("adds a song to playlist successfully", async () => {
    const s1 = await Song.create({ title: "S1", durationSec: 120 });

    const playlist = await Playlist.create({
      name: "MyList",
      owner: dj._id,
      songs: [],
      totalDurationSec: 0,
    });

    const res = await request(app)
      .post(`/api/playlist/${playlist._id}/add`)
      .set("Authorization", `Bearer ${djToken}`)
      .send({ songId: s1._id });

    expect(res.status).toBe(200);
    expect(res.body.playlist.songs.length).toBe(1);
  });

  test("rejects adding same song twice", async () => {
    const s1 = await Song.create({ title: "Repeat", durationSec: 120 });

    const playlist = await Playlist.create({
      name: "MyList",
      owner: dj._id,
      songs: [{ song: s1._id, order: 0 }],
      totalDurationSec: 120,
    });

    const res = await request(app)
      .post(`/api/playlist/${playlist._id}/add`)
      .set("Authorization", `Bearer ${djToken}`)
      .send({ songId: s1._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Song already in playlist");
  });

  test("rejects adding song that pushes playlist over 3 hours", async () => {
    const longSong = await Song.create({
      title: "LongTrack",
      durationSec: 2.5 * 60 * 60,
    });
    const anotherLong = await Song.create({
      title: "Another",
      durationSec: 2 * 60 * 60,
    });

    const playlist = await Playlist.create({
      name: "LimitBreaker",
      owner: dj._id,
      songs: [{ song: longSong._id, order: 0 }],
      totalDurationSec: 2.5 * 3600,
    });

    const res = await request(app)
      .post(`/api/playlist/${playlist._id}/add`)
      .set("Authorization", `Bearer ${djToken}`)
      .send({ songId: anotherLong._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Playlist cannot exceed 3 hours total duration");
  });

  test("clone playlist fails if playlist not found", async () => {
    const res = await request(app)
      .post("/api/playlist/65b1aaaaaa11111111111111/clone")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Playlist not found");
  });

  test("clone playlist fails if playlist private", async () => {
    const pl = await Playlist.create({
      name: "Private",
      owner: dj._id,
      isPublic: false,
      songs: [],
    });

    const res = await request(app)
      .post(`/api/playlist/${pl._id}/clone`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("This playlist is not public");
  });

  test("clone playlist fails if already cloned", async () => {
    const pl = await Playlist.create({
      name: "Public List",
      owner: dj._id,
      isPublic: true,
      songs: [],
    });

    await Playlist.create({
      name: "Public List (Copy)",
      owner: user._id,
      isPublic: false,
    });

    const res = await request(app)
      .post(`/api/playlist/${pl._id}/clone`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("You already added this playlist.");
  });

  test("fetch playlist returns 403 if private and not owner", async () => {
    const pl = await Playlist.create({
      name: "Hidden",
      owner: dj._id,
      isPublic: false,
    });

    const res = await request(app)
      .get(`/api/playlist/${pl._id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("This playlist is private.");
  });

  test("restricted songs are filtered automatically", async () => {
    const s1 = await Song.create({
      title: "Visible",
      durationSec: 120,
      restricted: false,
    });

    const s2 = await Song.create({
      title: "Hidden",
      durationSec: 120,
      restricted: true,
    });

    const pl = await Playlist.create({
      name: "FilterTest",
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
    expect(res.body.songs[0].song.title).toBe("Visible");
  });

  test("lists only public playlists", async () => {
    await Playlist.create({
      name: "Pub1",
      owner: dj._id,
      isPublic: true,
    });

    await Playlist.create({
      name: "Priv1",
      owner: dj._id,
      isPublic: false,
    });

    const res = await request(app).get("/api/playlist/discover");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Pub1");
  });
});
