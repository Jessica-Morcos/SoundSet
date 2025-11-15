// test-db.js
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.DOTENV_CONFIG_QUIET = "true";
process.env.JWT_SECRET = "testsecret";
process.env.NODE_ENV = "test";

let mongod;

// Allow tests to override the internal server reference
export const _setMongod = (instance) => {
  mongod = instance;
};

export const connectTestDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

export const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
};
