
import { getCollection } from "../config/db.js";

function usersCollection() {
  return getCollection("users");
}

export async function getAllUsers(filter = {}) {
  return usersCollection().find(filter).toArray();
}

export async function getUserByUserId(userId) {
  return usersCollection().findOne({ userId: userId });
}

export async function createUser(user) {
  const doc = {
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    address: user.address,
    github: user.github,
    skills: user.skills,
    stats: user.stats,
    badges: user.badges,
    createdAt: user.createdAt || new Date().toISOString()
  };

  await usersCollection().insertOne(doc);
  return doc;
}

export async function updateUserByUserId(userId, patch) {
  const result = await usersCollection().findOneAndUpdate(
    { userId: userId },
    { $set: patch },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function deleteUserByUserId(userId) {
  const result = await usersCollection().deleteOne({ userId: userId });
  return result.deletedCount === 1;
}
