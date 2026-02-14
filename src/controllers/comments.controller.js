import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAllComments,
  getCommentByCommentId,
  createComment,
  updateCommentByCommentId,
  deleteCommentByCommentId
} from "../services/comments.service.js";

export const getAll = asyncHandler(async function (req, res) {
  const filter = {};
  if (req.query.postId) filter.postId = req.query.postId;
  if (req.query.authorId) filter.authorId = req.query.authorId;
  if (req.query.flagged) filter.isFlagged = req.query.flagged === "true";

  const docs = await getAllComments(filter);
  res.json(docs);
});

export const getOne = asyncHandler(async function (req, res) {
  const doc = await getCommentByCommentId(req.params.commentId);
  if (!doc) return res.status(404).json({ message: "Comment not found" });
  res.json(doc);
});

export const create = asyncHandler(async function (req, res) {
  const created = await createComment(req.body);
  res.status(201).json(created);
});

export const update = asyncHandler(async function (req, res) {
  const updated = await updateCommentByCommentId(req.params.commentId, req.body);
  if (!updated) return res.status(404).json({ message: "Comment not found" });
  res.json(updated);
});

export const remove = asyncHandler(async function (req, res) {
  const ok = await deleteCommentByCommentId(req.params.commentId);
  if (!ok) return res.status(404).json({ message: "Comment not found" });
  res.json({ deleted: true });
});
