import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAllPosts,
  getPostByPostId,
  createPost,
  updatePostByPostId,
  deletePostByPostId
} from "../services/posts.service.js";

import { getUserByUserId } from "../services/users.service.js";
import { getAllComments } from "../services/comments.service.js";

export const getAll = asyncHandler(async function (req, res) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.tag) filter.tags = req.query.tag;

  const docs = await getAllPosts(filter);
  res.json(docs);
});

export const getOne = asyncHandler(async function (req, res) {
  const doc = await getPostByPostId(req.params.postId);
  if (!doc) return res.status(404).json({ message: "Post not found" });
  res.json(doc);
});

// Post with author + comments (manual join in Node, no aggregation)
export const getFull = asyncHandler(async function (req, res) {
  const post = await getPostByPostId(req.params.postId);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const author = await getUserByUserId(post.authorId);
  const comments = await getAllComments({ postId: post.postId });

  const response = {
    postId: post.postId,
    authorId: post.authorId,
    title: post.title,
    content: post.content,
    tags: post.tags,
    status: post.status,
    views: post.views,
    createdAt: post.createdAt,
    editedAt: post.editedAt,
    author: author || null,
    comments: comments
  };

  res.json(response);
});

export const create = asyncHandler(async function (req, res) {
  const created = await createPost(req.body);
  res.status(201).json(created);
});

export const update = asyncHandler(async function (req, res) {
  const updated = await updatePostByPostId(req.params.postId, req.body);
  if (!updated) return res.status(404).json({ message: "Post not found" });
  res.json(updated);
});

export const remove = asyncHandler(async function (req, res) {
  const ok = await deletePostByPostId(req.params.postId);
  if (!ok) return res.status(404).json({ message: "Post not found" });
  res.json({ deleted: true });
});
