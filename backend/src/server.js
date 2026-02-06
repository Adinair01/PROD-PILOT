const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// for reading .env
const { app } = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => console.log(` API running on :${PORT}`));
}

start().catch((err) => {
  console.error(" Failed to start server:", err);
  process.exit(1);
});