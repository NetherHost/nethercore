// Copyright 2025 Nether Host

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User.js");
const embed = require("../../config/embed.config.js");
const handleError = require("../../utils/handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");
const { loadMessages } = require("../../utils/language.js");
const { registerUser } = require("../../utils/register-user");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check response time of NetherCore."),

  async execute(interaction, client) {
    try {
      let user;
      user = await User.findOne({ "user.id": interaction.user.id });

      if (!user) {
        user = await registerUser(interaction.user, client);
      }

      const language = "en-US";
      const messages = loadMessages(language);
      const ping = Math.round(client.ws.ping);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(messages.botPingTitle)
            .setDescription(messages.botPingDescription.replace("{time}", ping))
            .setColor(config.general.botColor)
            .setFooter({
              text: "Nether Host | nether.host",
              iconURL: client.user.displayAvatarURL({ dynamic: true }),
            }),
        ],
      });
    } catch (error) {
      handleError(error);
      await interaction.reply(embed.error(error));
    }
  },
};
