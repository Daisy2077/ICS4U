import { getCollection } from "../config/db.js";

function commentsCollection() {
  return getCollection("comments");
}

export async function getAllComments(filter) {
  const f = filter || {};
  return commentsCollection().find(f).toArray();
}

export async function getCommentByCommentId(commentId) {
  return commentsCollection().findOne({ commentId: commentId });
}

export async function createComment(comment) {
  const doc = {
    commentId: comment.commentId,
    postId: comment.postId,
    authorId: comment.authorId,
    text: comment.text,
    isFlagged: comment.isFlagged || false,
    likeCount: comment.likeCount || 0,
    mentions: comment.mentions || [],
    createdAt: comment.createdAt || new Date().toISOString()
  };

  await commentsCollection().insertOne(doc);
  return doc;
}

export async function updateCommentByCommentId(commentId, patch) {
  const result = await commentsCollection().findOneAndUpdate(
    { commentId: commentId },
    { $set: patch },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function deleteCommentByCommentId(commentId) {
  const result = await commentsCollection().deleteOne({ commentId: commentId });
  return result.deletedCount === 1;
}
