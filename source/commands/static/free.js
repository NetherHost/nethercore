// Copyright 2025 Nether Host

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User.js");
const embed = require("../../config/embed.config.js");
const handleError = require("../../utils/handle-error.js");
const { loadMessages } = require("../../utils/language.js");
const { registerUser } = require("../../utils/register-user");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("free")
    .setDescription("Information about Nether Host's free servers."),

  async execute(interaction, client) {
    try {
      let user;
      user = await User.findOne({ "user.id": interaction.user.id });

      if (!user) {
        user = await registerUser(interaction.user, client);
      }

      const language = "en-US";
      const messages = loadMessages(language);

      const embed = new EmbedBuilder()
        .setTitle(messages.freeTitle)
        .setDescription(messages.freeDescription)
        .setColor("Red")
        .setFooter({
          text: "Nether Host | nether.host",
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        });

      await interaction.reply({
        embeds: [embed],
      });
    } catch (error) {
      handleError(error);
      await interaction.reply(embed.error(error));
    }
  },
};
