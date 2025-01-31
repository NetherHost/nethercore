// Copyright 2025 Nether Host

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const User = require("../../models/User.js");
const embed = require("../../config/embed.config.js");
const handleError = require("../../utils/handle-error.js");
const { loadMessages } = require("../../utils/language.js");
const { registerUser } = require("../../utils/register-user");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("free")
    .setDescription("Information on Servox, our new free server provider."),

  async execute(interaction, client) {
    try {
      let user;
      user = await User.findOne({ "user.id": interaction.user.id });

      if (!user) {
        user = await registerUser(interaction.user, client);
      }

      const language = user.language.value;
      const messages = loadMessages(language);

      const embed = new EmbedBuilder()
        .setTitle(messages.freeTitle)
        .setDescription(messages.freeDescription)
        .setColor("#3ef23c")
        .setFooter({
          text: "Servox | servox.org",
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL("https://servox.org")
          .setLabel(messages.servoxButtonText)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      handleError(error);
      await interaction.reply(embed.error(error));
    }
  },
};
