// Copyright 2025 Nether Host All rights reserved.
// Unauthorized use, modification, or distribution of this code is prohibited.

const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const { updateMemberCounter } = require("../../utils/members.js");

module.exports = async (client) => {
  const guild = client.guilds.cache.get(config.guildId);

  setInterval(
    () => {
      updateMemberCounter(guild, config.channels.memberCounterChannelId);
    },
    1000 * 60 * 3
  ); // 3 minutes
};
