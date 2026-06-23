const mongoose = require("mongoose");
const { logger } = require("../utils/logger");

async function connectDB(uri) {
  mongoose.set("strictQuery", true);

  // Surface runtime connection drops, not just the initial connect failure.
  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  logger.info("MongoDB connected");
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
}

module.exports = { connectDB, disconnectDB };
