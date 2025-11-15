import mongoose from "mongoose";
import Playlist from "../models/Playlist.js";

describe("🎵 PLAYLIST MODEL — FULL 100% COVERAGE", () => {
  // ❗ DO NOT connect here. testSetup.js already did.

  test("creates a playlist with required fields", async () => {
    const playlist = await Playlist.create({
      name: "My Playlist",
      owner: new mongoose.Types.ObjectId(),
    });

    expect(playlist.name).toBe("My Playlist");
    expect(playlist.owner).toBeDefined();
    expect(playlist.isPublic).toBe(false);
    expect(playlist.classification).toBe("general");
    expect(playlist.isActive).toBe(true);
    expect(playlist.totalDurationSec).toBe(0);
  });

  test("fails when required fields missing", async () => {
    await expect(Playlist.create({})).rejects.toBeDefined();
  });

  test("adds songs and preserves subdocument fields", async () => {
    const playlist = await Playlist.create({
      name: "Song List",
      owner: new mongoose.Types.ObjectId(),
    });

    const songId = new mongoose.Types.ObjectId();

    playlist.songs.push({ song: songId, order: 3 });
    await playlist.save();

    expect(playlist.songs.length).toBe(1);
    expect(playlist.songs[0].song.toString()).toBe(songId.toString());
    expect(playlist.songs[0].order).toBe(3);
  });

  test("rejects invalid enum values", async () => {
    await expect(
      Playlist.create({
        name: "Bad Enum",
        owner: new mongoose.Types.ObjectId(),
        classification: "wrong",
      })
    ).rejects.toBeDefined();
  });

  test("durationMinutes virtual returns rounded minutes", async () => {
    const playlist = await Playlist.create({
      name: "Duration Test",
      owner: new mongoose.Types.ObjectId(),
      totalDurationSec: 185,
    });

    expect(playlist.durationMinutes).toBe(3);
  });

  test("default values applied correctly", async () => {
    const playlist = await Playlist.create({
      name: "Defaults",
      owner: new mongoose.Types.ObjectId(),
    });

    expect(playlist.isPublic).toBe(false);
    expect(playlist.isActive).toBe(true);
    expect(playlist.classification).toBe("general");
    expect(playlist.songs).toEqual([]);
  });
});
