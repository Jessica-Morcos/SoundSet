// src/__tests__/test-db.full.test.js
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import {
  connectTestDB,
  disconnectTestDB,
  _setMongod,   // <-- added
} from "../test-db.js";

describe("🧪 test-db.js FULL COVERAGE", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("connectTestDB starts MongoMemoryServer and connects", async () => {
    const createSpy = jest
      .spyOn(MongoMemoryServer, "create")
      .mockResolvedValue({
        getUri: () => "mongodb://fake",
      });

    const connectSpy = jest
      .spyOn(mongoose, "connect")
      .mockResolvedValue({});

    await connectTestDB();

    expect(createSpy).toHaveBeenCalled();
    expect(connectSpy).toHaveBeenCalledWith("mongodb://fake");
  });

  test("disconnectTestDB drops DB, closes connection, and stops server", async () => {
    jest.spyOn(mongoose.connection, "dropDatabase").mockResolvedValue();
    jest.spyOn(mongoose.connection, "close").mockResolvedValue();

    const fakeServer = { stop: jest.fn().mockResolvedValue() };

    _setMongod(fakeServer);  // <-- set test instance

    await disconnectTestDB();

    expect(mongoose.connection.dropDatabase).toHaveBeenCalled();
    expect(mongoose.connection.close).toHaveBeenCalled();
    expect(fakeServer.stop).toHaveBeenCalled();
  });

  test("disconnectTestDB works when mongod = null", async () => {
    jest.spyOn(mongoose.connection, "dropDatabase").mockResolvedValue();
    jest.spyOn(mongoose.connection, "close").mockResolvedValue();

    _setMongod(null);   // <-- test null branch

    await disconnectTestDB();

    expect(mongoose.connection.dropDatabase).toHaveBeenCalled();
    expect(mongoose.connection.close).toHaveBeenCalled();
  });
});
