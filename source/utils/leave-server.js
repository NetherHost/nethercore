// Copyright 2025 Nether Host

const User = require("../models/User");
const color = require("chalk");

async function updateLeftAt(user) {
  try {
    await User.findOneAndUpdate(
      { "user.id": user.id },
      { $set: { leftAt: new Date() } }
    );

    console.log(
      color.green("[INFO] ") +
        color.white(`${user.username} has left the server.`)
    );
  } catch (error) {
    handleError(error);
  }
}

module.exports = { updateLeftAt };
