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
const fs = require("fs");
const JSON5 = require("json5");
const handleError = require("../../utils/handle-error.js");
const { loadMessages } = require("../../utils/language.js");
const { registerUser } = require("../../utils/register-user");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Link to the Nether Host server management panel."),
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
        .setTitle(messages.panelTitle)
        .setDescription(messages.panelDescription)
        .setColor(config.general.botColor)
        .setFooter({
          text: "Nether Host | nether.host",
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL("https://netherpanel.com")
          .setLabel(messages.panelButtonText)
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
