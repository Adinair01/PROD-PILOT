import { beforeAll, afterEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Environment must be set before any app module loads (config/env validates it).
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret_0123456789abcdef";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_0123456789abcdef";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/prodpilot_test";
process.env.COOKIE_SECURE = "false";
process.env.CORS_ORIGIN = "http://localhost:5173";

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  // Isolate tests: wipe all collections between cases.
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
