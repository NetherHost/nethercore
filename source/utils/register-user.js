// Copyright 2025 Nether Host

const User = require("../models/User.js");
const handleError = require("./handle-error.js");
const fs = require("fs");
const JSON5 = require("json5");
const color = require("chalk");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

async function registerUser(user, client) {
  try {
    let userData;
    userData = await User.findOne({ "user.id": user.id });

    if (userData) {
      return userData;
    } else {
      const guild = client.guilds.cache.get(config.guildId);
      const member = guild.members.cache.get(user.id);
      const userCreatedAt = user.createdAt ? user.createdAt : null;
      const userJoinedAt = member.joinedAt ? member.joinedAt : null;

      userData = new User({
        user: {
          id: user.id,
          username: user.username,
          avatarLink: user.displayAvatarURL({ dynamic: true }) || null,
        },
        link: {
          status: false,
          email: null,
        },
        tickets: [],
        language: {
          default: "en-US",
          value: "en-US",
        },
        staff: {
          isStaff: false,
          ticketMessages: 0,
          ticketsClosed: 0,
        },
        ticketBanned: false,
        createdAt: userCreatedAt,
        joinedAt: userJoinedAt,
        leftAt: null,
      });

      await userData.save();

      console.log(
        color.green("[INFO] ") +
          color.white(`Registered new member ${user.username}`)
      );

      return userData;
    }
  } catch (error) {
    handleError(error);
  }
}

async function registerUserAsSpanish(user, client) {
  try {
    let userData;
    userData = await User.findOne({ "user.id": user.id });

    if (userData) {
      return userData;
    } else {
      const guild = client.guilds.cache.get(config.guildId);
      const member = guild.members.cache.get(user.id);
      const userCreatedAt = user.createdAt ? user.createdAt : null;
      const userJoinedAt = member.joinedAt ? member.joinedAt : null;

      userData = new User({
        user: {
          id: user.id,
          username: user.username,
          avatarLink: user.displayAvatarURL({ dynamic: true }) || null,
        },
        link: {
          status: false,
          email: null,
        },
        tickets: [],
        language: {
          default: "en-US",
          value: "es-ES",
        },
        staff: {
          isStaff: false,
          ticketMessages: 0,
          ticketsClosed: 0,
        },
        ticketBanned: false,
        createdAt: userCreatedAt,
        joinedAt: userJoinedAt,
        leftAt: null,
      });

      await userData.save();

      console.log(
        color.green("[INFO] ") +
          color.white(`Registered new member ${user.username}`)
      );

      return userData;
    }
  } catch (error) {
    handleError(error);
  }
}

module.exports = { registerUser, registerUserAsSpanish };
