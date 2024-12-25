const mongoose = require("mongoose");
const express = require("express");
require("dotenv").config();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { uploadOnCloudinary } = require("./cloudinary/cloudinary.config");
// const { singleUpload } = require("./middlewares/multer.middleware");
const { upload } = require("./middlewares/multer.middleware");
const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

const cors = require("cors");
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
const { initializeDatabase } = require("./db/db.connection");
initializeDatabase();
app.use("/public/temp", express.static("/public/temp"));
const { User } = require("./models/user.models");
const { Post } = require("./models/post.models");
const { verifyAuth } = require("./middlewares/auth.middleware");
const {
  removeComment,
  addComment,
  addPost,
  deletePost,
  getAllPost,
  updatePostById,
  getPostById,
  likePost,
  unlikePost,
} = require("./utils/posts.function");
const {
  signUp,
  changeAvatar,
  unfollowUser,
  followingUser,
  getAllBookmarks,
  addBookmark,
  removeBookmark,
  getAllUser,
  getUserById,
  login,
  updateProfile,
} = require("./utils/user.function");

app.get("/", (req, res) => {
  res.send("Social Media Application");
});

// routes for login and signup

app.post("/user/signup", async (req, res) => {
  const userData = req.body;
  if (
    !userData.name ||
    !userData.username ||
    !userData.email ||
    !userData.password
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const isUserExist = await User.findOne({ email: userData.email });
  if (isUserExist) {
    console.log("Duplicate user");
    return res.status(409).json({ message: "user already exist" });
  } else {
    try {
      const newUser = await signUp(userData);

      if (newUser) {
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
          expiresIn: "24h",
        });
        res
          .status(201)
          .json({ message: "SignUp successful", user: newUser, token });
      } else {
        res.status(400).json({ message: "SignUp failed" });
      }
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ message: "Internal Server Error", error });
    }
  }
});

app.post("/user/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email })
      .populate("followers", "username")
      .populate("following", "username")
      .populate("posts");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const loggedInUser = await login(user, password);
    if (!loggedInUser) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: loggedInUser._id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.status(200).json({
      message: "Login Successful",
      user: loggedInUser,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

//get all users
app.get("/users", async (req, res) => {
  try {
    const users = await getAllUser();
    if (users) {
      res
        .status(200)
        .json({ message: "Got all users successfully", users: users });
    } else {
      res.status(404).json({ message: "Failed to load all users" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Issue", error });
  }
});

//get user by Id
app.get("/user/profile", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await getUserById(userId);
    if (user) {
      res
        .status(200)
        .json({ message: "User data fetched successfully", profile: user });
    } else {
      res.status(404).json({ message: "Failed to fetch the user" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Issue", error });
  }
});

app.put("/user/profile/update", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const { updatedData } = req.body;
  try {
    const user = await getUserById(userId);
    if (user) {
      const updatedProfile = await updateProfile(userId, updatedData);
      if (updatedProfile) {
        res
          .status(200)
          .json({ message: "User Profile Update", profile: updatedProfile });
      } else {
        res.status(400).json({ message: "User profile updation failed" });
      }
    } else {
      res.status("Invalid user, Please login again");
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//routes for following users
app.post("/user/follow/:followerUserId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { followerUserId } = req.params;

    const updatedUser = await followingUser(userId, followerUserId);
    if (updatedUser) {
      res.status(200).json({
        message: "User Followed",
        user: updatedUser.user,
        followUser: updatedUser.followUser,
      });
    } else {
      res.status(404).json({ message: "Failed to follow the user" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Issue" });
  }
});

//routes for unfollow users
app.post("/user/unfollow/:follwerUserId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { follwerUserId } = req.params;

    const updatedUser = await unfollowUser(userId, follwerUserId);
    if (updatedUser) {
      res.status(200).json({
        message: "User Unfollowed Successfully",
        user: updatedUser.user,
        unfollowUser: updatedUser.unfollowUser,
      });
    } else {
      res.status(404).json({ message: "Failed to unfollow" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Issue" });
  }
});

//change avatar
app.post(
  "/user/change-avatar",
  verifyAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const file = req.file;

      const result = await uploadOnCloudinary(file.path);
      const avatar = {
        public_id: result.public_id,
        url: result.secure_url,
      };
      const updateAvatar = await changeAvatar(userId, avatar);
      if (updateAvatar) {
        res
          .status(200)
          .json({ message: "Avatar updated successfully", user: updateAvatar });
      } else {
        res.status(404).json({ message: "Failed to update Avatar" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal Server Issue", error });
    }
  }
);

//routes apis for post

//get all post
app.get("/user/post", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const post = await getAllPost(userId);
    if (post) {
      res.status(200).json({ message: "Posts found", post });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//get postById
app.get("/user/post/:postId", verifyAuth, async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.user;
  try {
    const post = await getPostById(userId, postId);
    if (post) {
      res.status(200).json({ message: "Post found", post });
    } else {
      res.status(404).json({ message: "Error posting found", error });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

//add post
app.post(
  "/user/post",
  verifyAuth,
  upload.array("media", 5),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const { caption } = req.body;
      const files = req.files; // For multiple files, multer provides req.files

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      //upload files to cloudinary
      const mediaArray = await Promise.all(
        files.map(async (file) => {
          const cloudResponse = await uploadOnCloudinary(file.path);
          return {
            public_id: cloudResponse.public_id,
            url: cloudResponse.secure_url,
          };
        })
      );
      const postData = {
        caption,
        media: mediaArray || null,
      };

      const newPost = await addPost(userId, postData);
      if (newPost) {
        res
          .status(201)
          .json({ message: "Post created successfully", post: newPost });
      } else {
        res.status(400).json({ message: "Post creation failed" });
      }
    } catch (error) {
      console.log("Error creating post");
      res.status(500).json({ message: "Internal Server Error", error });
    }
  }
);

//update post
app.put(
  "/user/post/edit/:postId",
  verifyAuth,
  upload.array("media", 5),
  async (req, res) => {
    const { postId } = req.params;
    const { caption } = req.body;
    const { userId } = req.user;
    const files = req.files;

    try {
      let mediaArray = [];

      // If new files are uploaded, upload them to Cloudinary
      if (files && files.length > 0) {
        mediaArray = await Promise.all(
          files.map(async (file) => {
            const cloudResponse = await uploadOnCloudinary(file.path);
            return {
              public_id: cloudResponse.public_id,
              url: cloudResponse.secure_url,
            };
          })
        );
      }

      // Prepare the data to update
      const dataToUpdate = {};
      if (caption) dataToUpdate.caption = caption;
      if (mediaArray.length > 0) dataToUpdate.media = mediaArray;

      // Update the post in the database
      const updatedPost = await updatePostById(postId, dataToUpdate, userId, {
        new: true,
      });

      if (updatedPost) {
        res.status(200).json({ message: "Post updated", post: updatedPost });
      } else {
        res.status(404).json({ message: "Post not found" });
      }
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Internal Server error", error });
    }
  }
);

//delete post
app.delete("/user/post/:postId", verifyAuth, async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.user;
  try {
    const deletedPost = await deletePost(userId, postId);
    if (deletedPost) {
      res
        .status(200)
        .json({ message: "Post deleted successfully", post: deletedPost });
    } else {
      res.status(404).json({ message: "Failed to delete post" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Service Error" });
  }
});

//liking a post
app.post("/user/post/like/:postId", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const { postId } = req.params;
  try {
    const post = await likePost(userId, postId);
    if (!post) {
      res.status(404).json({ message: "Error in liking the Post." });
    } else {
      res.status(200).json({ message: "Liked Post", post });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Issues" });
  }
});

app.post("/user/post/unlike/:postId", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const { postId } = req.params;
  try {
    const post = await unlikePost(userId, postId);
    if (post) {
      res.status(200).json({ message: "Post dislike successfully.", post });
    } else {
      res.status(404).json({ message: "Failed to dislike the post" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Service Error" });
  }
});

//adding bookmark to users
app.post("/user/bookmark/:postId", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const { postId } = req.params;
  try {
    const bookmarkPost = await addBookmark(userId, postId);
    if (bookmarkPost) {
      res.status(200).json({
        message: "Added to bookmark successfully",
        bookmarks: bookmarkPost,
      });
    } else {
      res.status(404).json;
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//remove from bookmark
app.delete("/user/remove-bookmark/:postId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;

    const removedBookmark = await removeBookmark(userId, postId);
    if (removedBookmark) {
      res.status(200).json({
        message: "Bookmark removed successfully.",
        bookmark: removedBookmark,
      });
    } else {
      res.status(404).json({ message: "Failed to remove the Bookmark." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Service Error" });
  }
});

//get all bookmark
app.get("/user/bookmarks", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.user;

    const bookmarks = await getAllBookmarks(userId);
    if (bookmarks) {
      res.status(200).json({ message: "All saved bookmarks", bookmarks });
    } else {
      res.status(404).json({ message: "Failed to load all bookmarks." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Issue", error });
  }
});

//add comment routes
app.post("/user/post/comment/:postId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;
    const commentedData = req.body;
    const updatedPost = await addComment(userId, postId, commentedData);
    if (updatedPost) {
      res.status(200).json({
        message: "Comment added Successfully",
        post: updatedPost,
      });
    } else {
      res.status(404).json({ message: "Failed to add comment" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Issue", error });
  }
});

//remove comment
app.delete(
  "/user/post/:postId/delete-comment/:commentId",
  verifyAuth,
  async (req, res) => {
    try {
      const { userId } = req.user;
      const { postId } = req.params;
      const { commentId } = req.params;
      const deletedComment = await removeComment(userId, postId, commentId);
      if (deletedComment) {
        res.status(200).json({
          message: "Comment deleted successfully",
          post: deletedComment,
        });
      } else {
        res.status(404).json({ message: "Failed to delete comment" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal Server Issue" });
    }
  }
);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
