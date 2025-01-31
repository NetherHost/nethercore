// Copyright 2025 Nether Host

const color = require("chalk");
const handleError = require("./handle-error.js");

async function updateMemberCounter(guild, channelId) {
  const channel = guild.channels.cache.get(channelId);
  const { memberCount } = guild;

  if (!channel) {
    return console.error(
      color.red("[ERROR] ") +
        color.white(
          "Member Counter channel not found. Check the Channel ID in /config/general.json5"
        )
    );
  }

  await channel.setName(`Members: ${memberCount}`);
  console.log(
    color.green("[INFO] ") + color.white(`New member count: ${memberCount}`)
  );
}

async function autorole(member, role) {
  if (role && member) {
    try {
      await member.roles.add(role);
      console.log(
        color.green("[INFO] ") +
          color.white(`Added role ${role.name} to ${member.user.username}`)
      );
    } catch (error) {
      handleError(error);
    }
  } else {
    console.error(
      color.red("[ERROR] ") +
        color.white(
          "Member or role not found. Ensure role ID in /config/general.json5"
        )
    );
  }
}

module.exports = { updateMemberCounter, autorole };
