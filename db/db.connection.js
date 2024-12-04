const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = process.env.mongoDB;

const initializeDatabase = async () => {
  try {
    const connection = await mongoose.connect(mongoURI);

    if (connection) {
      console.log("Connected Successfully");
    } else {
      console.error("Database Connection Error:");
    }
  } catch (error) {
    console.log("Connection Failed", error);
  }
};

module.exports = { initializeDatabase };
