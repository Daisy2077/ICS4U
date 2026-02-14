import { getCollection } from "../config/db.js";

function postsCollection() {
  return getCollection("posts");
}

export async function getAllPosts(filter) {
  const f = filter || {};
  return postsCollection().find(f).toArray();
}

export async function getPostByPostId(postId) {
  return postsCollection().findOne({ postId: postId });
}

export async function createPost(post) {
  const doc = {
    postId: post.postId,
    authorId: post.authorId,
    title: post.title,
    content: post.content,
    tags: post.tags,
    status: post.status,
    views: post.views || 0,
    createdAt: post.createdAt || new Date().toISOString(),
    editedAt: post.editedAt
  };

  await postsCollection().insertOne(doc);
  return doc;
}

export async function updatePostByPostId(postId, patch) {
  const result = await postsCollection().findOneAndUpdate(
    { postId: postId },
    { $set: patch },
    { returnDocument: "after" }
  );
  return result.value;
}

export async function deletePostByPostId(postId) {
  const result = await postsCollection().deleteOne({ postId: postId });
  return result.deletedCount === 1;
}
