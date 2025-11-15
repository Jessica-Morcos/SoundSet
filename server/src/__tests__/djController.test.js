import request from "supertest";
import app from "../test-utils/server.js";


import User from "../models/User.js";
import DjProfile from "../models/DjProfile.js";
import Playlist from "../models/Playlist.js";
import "../test-db.js";
import bcrypt from "bcryptjs";

describe("DJ Controller", () => {
  let user;
  let token;

  beforeEach(async () => {
    await DjProfile.deleteMany();
    await Playlist.deleteMany();
    await User.deleteMany();

    const hash = await bcrypt.hash("password", 10);

    user = await User.create({
      username: "djtester",
      passwordHash: hash,
      role: "dj",
      isActive: true,
    });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "djtester", password: "password" });

    token = login.body.token;
  });

  test("creates a DJ profile", async () => {
    const res = await request(app)
      .post("/api/dj")
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "DJ Max",
        bio: "House music DJ",
        classifications: ["wedding", "club"],
  });


    expect(res.status).toBe(201);
    expect(res.body.profile.displayName).toBe("DJ Max");
  });

  test("updates an existing DJ profile", async () => {
    await DjProfile.create({
      user: user._id,
      displayName: "Old Name",
      bio: "Old bio",
      classifications: ["general"],
    });

    const res = await request(app)
      .post("/api/dj")
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "Updated Name",
        bio: "New bio",
        classifications: ["club"],
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("DJ profile updated");
    expect(res.body.profile.displayName).toBe("Updated Name");
  });

  test("lists all DJs", async () => {
    await DjProfile.create({
      user: user._id,
      displayName: "DJ Max",
      bio: "House",
      classifications: ["club"],
    });

    const res = await request(app)
    .get("/api/dj")
    .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test("gets DJ profile by ID with playlists", async () => {
    const profile = await DjProfile.create({
      user: user._id,
      displayName: "DJ Public",
      bio: "Bio",
    });

    await Playlist.create({
      name: "Public Mix",
      owner: user._id,
      isPublic: true,
      songs: [],
    });

    const res = await request(app)
  .get(`/api/dj/${profile._id}`)
  .set("Authorization", `Bearer ${token}`);


    expect(res.status).toBe(200);
    expect(res.body.profile.displayName).toBe("DJ Public");
    expect(res.body.playlists.length).toBe(1);
  });

  test("returns 404 when DJ not found", async () => {
    const fakeId = "65a9b4cb5c03a44fa0b9b999";

    const res = await request(app).get(`/api/dj/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("DJ not found");
  });
});
