const { Post } = require("../models/post.models");
const { User } = require("../models/user.models");

const addPost = async (userId, postData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    } else {
      const post = {
        caption: postData.caption,
        media: postData.media,
        author: user,
        // author: postData.author,
      };

      const newPost = new Post(post);
      await newPost.save();
      await newPost.populate("author", "username media");

      user.posts.push(newPost);
      await user.save();
      return newPost;
    }
  } catch (error) {
    throw error;
  }
};

const getAllPost = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    } else {
      const allPosts = await Post.find()
        .populate("author", "username media")
        .populate("likes", "username")
        .populate("comments.commentedBy", "username media");

      return allPosts;
    }
  } catch (error) {
    throw error;
  }
};

const getPostById = async (userId, postId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    } else {
      const posts = await Post.findById(postId)
        .populate("author", "username media")
        .populate("likes", "username")
        .populate("comments.commentedBy", "username media");
      return posts;
    }
  } catch (error) {
    throw error;
  }
};

const updatePostById = async (postId, dataToUpdate, userId) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return null; // Post not found
    }

    // Ensure the logged-in user is the author
    if (post.author.toString() !== userId) {
      throw new Error("Unauthorized: You can only update your own posts");
    }
    const updatePost = await Post.findByIdAndUpdate(postId, dataToUpdate, {
      new: true,
    })
      .populate("author", "username media")
      .populate("likes", "username")
      .populate("comments.commentedBy", "username media");
    return updatePost;
  } catch (error) {
    throw error;
  }
};

const likePost = async (userId, postId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    } else {
      const post = await Post.findById(postId)
        .populate("likes", "username ")
        .populate("author", "username")
        .populate("comments.commentedBy", "username media");
      post.likes.push(user);
      await post.save();

      return post;
    }
  } catch (error) {
    throw error;
  }
};

const unlikePost = async (userId, postId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    } else {
      const post = await Post.findById(postId)
        .populate("likes", "username ")
        .populate("author", "username")
        .populate("comments.commentedBy", "username media");

      const updatedLikes = post.likes.filter(
        ({ _id }) => _id.toHexString() != user._id.toHexString()
      );
      post.likes = updatedLikes;
      await post.save();
      return post;
    }
  } catch (error) {
    throw error;
  }
};

const deletePost = async (userId, postId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    } else {
      const deletePost = await Post.findByIdAndDelete(postId);
      const updatedUserPost = user.posts.filter(
        (_id) => _id.toHexString() !== deletePost._id.toHexString()
      );
      user.posts = updatedUserPost;
      await user.save();

      return deletePost;
    }
  } catch (error) {
    throw error;
  }
};

const addComment = async (userId, postId, commentData) => {
  try {
    const [post, user] = await Promise.all([
      Post.findById(postId)
        .populate("likes", "username")
        .populate("comments.commentedBy", "username image")
        .populate("author", "username image"),
      User.findById(userId),
    ]);
    if (!post || !user) {
      throw new Error("Post or user not found");
    }

    const newComment = {
      commentText: commentData.newComment,
      commentedBy: user._id,
      commentAt: Date.now(),
    };
    post.comments.push(newComment);
    await post.save();
    return post;
  } catch (error) {
    console.log("Falied to add comment", error);
  }
};

const removeComment = async (userId, postId, commentId) => {
  try {
    const [post, user] = await Promise.all([
      Post.findById(postId)
        .populate("likes", "username")
        .populate("comments.commentedBy", "username")
        .populate("author", "username image"),
      User.findById(userId),
    ]);

    const commentToDelete = post.comments.find(
      ({ _id }) => _id.toHexString() === commentId
    );

    if (commentToDelete.commentedBy.username === user.username) {
      const updatedComments = post.comments.filter(
        ({ _id }) => _id.toHexString() !== commentToDelete._id.toHexString()
      );

      post.comments = updatedComments;
      await post.save();

      return post;
    } else {
      console.log("No authorized to delete the comment");
    }
  } catch (error) {
    console.group("Erro deleting the comment");
  }
};

module.exports = {
  removeComment,
  addComment,
  addPost,
  deletePost,
  getAllPost,
  updatePostById,
  getPostById,
  likePost,
  unlikePost,
};
