const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    caption: {
      type: String,
      required: true,
    },
    media: [
      {
        public_id: String,
        url: String,
      },
    ],

    comments: [
      {
        commentText: {
          type: String,
          required: true,
        },
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        commentAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };
