import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAllUsers,
  getUserByUserId,
  createUser,
  updateUserByUserId,
  deleteUserByUserId
} from "../services/users.service.js";

export const getAll = asyncHandler(async function (req, res) {
  const filter = {};

  if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.city) {
    filter["address.city"] = req.query.city;
  }

  const docs = await getAllUsers(filter);
  res.json(docs);
});


export const getOne = asyncHandler(async function (req, res) {
  const doc = await getUserByUserId(req.params.userId);
  if (!doc) return res.status(404).json({ message: "User not found" });
  res.json(doc);
});

export const create = asyncHandler(async function (req, res) {
  const created = await createUser(req.body);
  res.status(201).json(created);
});

export const update = asyncHandler(async function (req, res) {
  const updated = await updateUserByUserId(req.params.userId, req.body);
  if (!updated) return res.status(404).json({ message: "User not found" });
  res.json(updated);
});

export const remove = asyncHandler(async function (req, res) {
  const ok = await deleteUserByUserId(req.params.userId);
  if (!ok) return res.status(404).json({ message: "User not found" });
  res.json({ deleted: true });
});
