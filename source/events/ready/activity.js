// Copyright 2025 Nether Host All rights reserved.
// Unauthorized use, modification, or distribution of this code is prohibited.

const { ActivityType } = require("discord.js");

module.exports = (client) => {
  client.user.setActivity({
    name: "nether.host",
    type: ActivityType.Watching,
  });
};
