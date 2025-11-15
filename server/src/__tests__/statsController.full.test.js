// src/__tests__/statsController.full.test.js
import { jest } from "@jest/globals";
import "../test-db.js";
import mongoose from "mongoose";

import Song from "../models/Song.js";
import PlayHistory from "../models/PlayHistory.js";
import {
  logPlay,
  getFrequency,
  getTopArtists,
  getTopGenres,
} from "../controllers/statsController.js";

// helper to mock req/res
function makeReqRes(reqOverrides = {}, resOverrides = {}) {
  const req = {
    user: { _id: new mongoose.Types.ObjectId() },
    body: {},
    params: {},
    ...reqOverrides,
  };

  const res = {
    statusCode: 200,
    jsonData: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    ...resOverrides,
  };

  return { req, res };
}

describe("📊 STATS CONTROLLER — FULL 100% COVERAGE", () => {
  const validId = "507f1f77bcf86cd799439011";

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------- logPlay ----------------

  test("logPlay returns 400 for invalid songId", async () => {
    const { req, res } = makeReqRes({
      body: { songId: "not-an-objectid" },
    });

    await logPlay(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.message).toBe("Invalid song ID");
  });

  test("logPlay returns 404 when song not found", async () => {
    jest.spyOn(Song, "findById").mockResolvedValue(null);

    const { req, res } = makeReqRes({
      body: { songId: validId },
    });

    await logPlay(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.message).toBe("Song not found");
  });

  test("logPlay creates PlayHistory and returns 201 on success", async () => {
    jest.spyOn(Song, "findById").mockResolvedValue({
      _id: validId,
      title: "Test Song",
    });

    const createSpy = jest
      .spyOn(PlayHistory, "create")
      .mockResolvedValue({});

    const { req, res } = makeReqRes({
      body: { songId: validId },
    });

    await logPlay(req, res);

    expect(Song.findById).toHaveBeenCalledWith(validId);
    expect(createSpy).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.jsonData.message).toBe("Play logged for Test Song");
  });

  test("logPlay returns 500 if an error occurs", async () => {
    jest
      .spyOn(Song, "findById")
      .mockRejectedValue(new Error("DB failure in logPlay"));

    const { req, res } = makeReqRes({
      body: { songId: validId },
    });

    await logPlay(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.message).toBe("Failed to log play");
  });

  // ---------------- getFrequency ----------------

  test("getFrequency returns aggregated play frequency data", async () => {
    const fakeData = [
      {
        _id: new mongoose.Types.ObjectId(),
        count: 5,
        songInfo: { title: "Song A", artist: "Artist A", genre: "Pop" },
      },
    ];

    const aggSpy = jest
      .spyOn(PlayHistory, "aggregate")
      .mockResolvedValue(fakeData);

    const { req, res } = makeReqRes();

    await getFrequency(req, res);

    expect(aggSpy).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual(fakeData);
  });

  test("getFrequency returns 500 on aggregate error", async () => {
    jest
      .spyOn(PlayHistory, "aggregate")
      .mockRejectedValue(new Error("Agg error"));

    const { req, res } = makeReqRes();

    await getFrequency(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.message).toBe("Failed to fetch song frequency");
  });

  // ---------------- getTopArtists ----------------

  test("getTopArtists returns data from aggregate", async () => {
    const fakeData = [
      { _id: "Artist 1", plays: 10 },
      { _id: "Artist 2", plays: 7 },
    ];

    const aggSpy = jest
      .spyOn(PlayHistory, "aggregate")
      .mockResolvedValue(fakeData);

    const { req, res } = makeReqRes();

    await getTopArtists(req, res);

    expect(aggSpy).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual(fakeData);
  });

  test("getTopArtists returns 500 on error", async () => {
    jest
      .spyOn(PlayHistory, "aggregate")
      .mockRejectedValue(new Error("Artist agg error"));

    const { req, res } = makeReqRes();

    await getTopArtists(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.message).toBe("Failed to fetch artist stats");
  });

  // ---------------- getTopGenres ----------------

  test("getTopGenres returns data from aggregate", async () => {
    const fakeData = [
      { _id: "Pop", plays: 12 },
      { _id: "R&B", plays: 8 },
    ];

    const aggSpy = jest
      .spyOn(PlayHistory, "aggregate")
      .mockResolvedValue(fakeData);

    const { req, res } = makeReqRes();

    await getTopGenres(req, res);

    expect(aggSpy).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual(fakeData);
  });

  test("getTopGenres returns 500 on error", async () => {
    jest
      .spyOn(PlayHistory, "aggregate")
      .mockRejectedValue(new Error("Genre agg error"));

    const { req, res } = makeReqRes();

    await getTopGenres(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.message).toBe("Failed to fetch genre stats");
  });
});
