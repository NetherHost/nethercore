// Copyright 2025 Nether Host

const { autorole } = require("../../utils/members.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const handleError = require("../../utils/handle-error.js");

module.exports = async (client, member) => {
  try {
    const guild = client.guilds.cache.get(config.guildId);
    const role = guild.roles.cache.get(config.roles.communityRoleId);

    await autorole(member, role);
  } catch (error) {
    handleError(error);
  }
};
