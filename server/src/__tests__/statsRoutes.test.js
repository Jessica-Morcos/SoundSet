import { jest } from "@jest/globals";

import request from "supertest";
import app from "../test-utils/server.js";
import User from "../models/User.js";
import Song from "../models/Song.js";
import PlayHistory from "../models/PlayHistory.js";
import "../test-db.js";

describe("📈 Stats ROUTES missing branches", () => {
  let user, token;

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
  });

  test("❌ /log returns 404 when song not found", async () => {
    const res = await request(app)
      .post("/api/stats/log")
      .set("Authorization", `Bearer ${token}`)
      .send({ songId: "507f1f77bcf86cd799439011" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Song not found");
  });

  test("💥 /log returns 500 on DB error", async () => {
    jest.spyOn(Song, "findById").mockRejectedValue(new Error("DB exploded"));

    const res = await request(app)
      .post("/api/stats/log")
      .set("Authorization", `Bearer ${token}`)
      .send({ songId: "507f1f77bcf86cd799439011" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to log play");
  });

    test("💥 /artist returns 500 on DB error", async () => {
    jest.spyOn(PlayHistory, "aggregate").mockRejectedValue(new Error("agg"));

    const res = await request(app)
        .get("/api/stats/artist")
        .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body).toBeDefined();
    });

    test("💥 /genre returns 500 on DB error", async () => {
    jest.spyOn(PlayHistory, "aggregate").mockRejectedValue(new Error("agg"));

    const res = await request(app)
        .get("/api/stats/genre")
        .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body).toBeDefined();
    });

});
