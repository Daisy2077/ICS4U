import "dotenv/config";
import app from "./app.js";
import { connectToMongo } from "./config/db.js";

const PORT = process.env.PORT || 3000;

async function start() {
  await connectToMongo();
  app.listen(PORT, "0.0.0.0", function () {
    console.log("Server running on port " + PORT);
  });
}

start();
