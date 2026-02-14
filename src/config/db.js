import { MongoClient } from "mongodb";

let client;
let db;

export async function connectToMongo() {
  if (db) return db;

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  db = client.db(process.env.DB_NAME);
  console.log("Connected to MongoDB (Node driver)");
  return db;
}

export function getCollection(name) {
  if (!db) {
    throw new Error("Database not ready. Call connectToMongo() first.");
  }
  return db.collection(name);
}
