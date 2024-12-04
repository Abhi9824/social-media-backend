const cloudinary = require("cloudinary");
const bcrypt = require("bcryptjs");

const { Post } = require("../models/post.models.js");
const { User } = require("../models/user.models.js");

const signUp = async (userData) => {
  const { name, username, password, email } = userData;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      name: name,
      username: username,
      email: email,
      password: hashedPassword,
    };
    const newUser = new User(user);
    const savedUser = await newUser.save();
    return savedUser;
  } catch (error) {
    console.log("Error creating a new user", error);
  }
};

const login = async (user, password) => {
  try {
    if (!user || !user.password) {
      console.log("User or user password not found");
      return null;
    }
    if (!password) {
      console.log("password not provided");
      return null;
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      return user;
    } else {
      console.log("Incorrect password");
    }
  } catch (error) {
    console.error("Error logging in :-", error);
  }
};

const getAllUser = async () => {
  try {
    const allUser = await User.find();
    return allUser;
  } catch (error) {
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate("followers", "username")
      .populate("following", "username")
      .populate("posts");
    return user;
  } catch (error) {
    throw error;
  }
};

const addBookmark = async (userId, postId) => {
  try {
    const user = await User.findById(userId);
    const post = await Post.findById(postId);
    user.bookmarks.push(post);
    await user.save();
    return post;
  } catch (error) {
    throw error;
  }
};

const removeBookmark = async (userId, postId) => {
  try {
    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    const updatedBookmarks = user.bookmarks.filter(
      (id) => id.toHexString() !== post._id.toHexString()
    );

    user.bookmarks = updatedBookmarks;
    await user.save();
    return post;
  } catch (error) {
    throw error;
  }
};

const getAllBookmarks = async (userId) => {
  try {
    const user = await User.findById(userId).populate("bookmarks");

    return user.bookmarks;
  } catch (error) {
    console.log("Error getting bookmarks", error);
  }
};

const followingUser = async (userId, followerUserId) => {
  try {
    const user = await User.findById(userId)
      .populate("followers", "username")
      .populate("following", "username")
      .populate("posts");

    const followUser = await user
      .findById(followerUserId)
      .populate("followers", "username")
      .populate("following", "username")
      .populate("posts");

    user.following.push(followUser);
    followUser.followers.push(user);
    await user.save();
    await followUser.save();
    return { user, followUser };
  } catch (error) {
    console.log("Falied to Follow the user");
  }
};

const unfollowUser = async (userId, unfollowUserId) => {
  try {
    const user = await User.findById(userId)
      .populate("followers", "username")
      .populate("following", "username")
      .populate("posts");

    const unfollowUser = await User.findById(unfollowUserId)
      .populate("followers", "username")
      .populate("following", "username")
      .populate("posts");

    const updatedFollowing = user.followers.filter(
      (user) => user._id !== unfollowUser._id
    );
    user.following = updatedFollowing;
    await user.save();

    await unfollowUser.save();

    return { user, unfollowUser };
  } catch (error) {
    throw error;
  }
};

const changeAvatar = async (userId, avatar) => {
  try {
    const user = await User.findById(userId);

    if (user.image?.public_id) {
      await cloudinary.v2.uploader.destroy(user.image.public_id);
    }
    user.image = avatar;
    await user.save();
    return user;
  } catch (error) {
    console.log("Error updating avatar");
  }
};

module.exports = {
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
};
