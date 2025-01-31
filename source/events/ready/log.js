// Copyright 2025 Nether Host All rights reserved.
// Unauthorized use, modification, or distribution of this code is prohibited.

const color = require("chalk");

module.exports = (client) => {
  console.log(
    color.green("[INFO] ") + color.white(`${client.user.username} is online`)
  );
};
