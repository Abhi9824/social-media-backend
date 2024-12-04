const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      public_id: String,
      url: String,
    },
    bio: {
      type: String,
      maxLength: 150,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
