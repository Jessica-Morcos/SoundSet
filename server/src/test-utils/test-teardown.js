// src/test-utils/test-teardown.js
export default async function globalTeardown() {
  console.log("🧹 Global Teardown: Closing MongoDB Memory Server and Mongoose");

  // Close mongoose connection if it's still open
  const mongoose = (await import("mongoose")).default;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  // Stop MongoMemoryServer if it is running
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
}
