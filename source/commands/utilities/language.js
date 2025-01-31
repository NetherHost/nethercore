// Copyright 2025 Nether Host

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User.js");
const embed = require("../../config/embed.config.js");
const handleError = require("../../utils/handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");
const { loadMessages, languageChoices } = require("../../utils/language.js");
const { registerUser } = require("../../utils/register-user.js");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("language")
    .setDescription("Choose the language that NetherCore will use.")
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("Choose which language to use.")
        .setRequired(true)
        .addChoices(
          { name: "العربية (Arabic)", value: "ar" },
          { name: "中文 (Chinese)", value: "zh-CN" },
          { name: "Deutsch (German)", value: "de-DE" },
          { name: "English (United Kingdom)", value: "en-GB" },
          { name: "English (United States)", value: "en-US" },
          { name: "Español (Spanish)", value: "es-ES" },
          { name: "Français (French)", value: "fr-FR" },
          { name: "Hindi (Indian)", value: "hi-IN" },
          { name: "Bahasa Indonesia (Indonesian)", value: "id-ID" },
          { name: "日本語 (Japanese)", value: "ja-JP" },
          { name: "Nederlands (Dutch)", value: "nl-NL" },
          { name: "Português (Portuguese)", value: "pt-PT" },
          { name: "Русский (Russian)", value: "ru-RU" }
        )
    ),

  async execute(interaction, client) {
    try {
      const language = interaction.options.getString("language");
      const messages = loadMessages(language);
      let user;

      user = await User.findOne({ "user.id": interaction.user.id });

      if (!user) {
        user = await registerUser(interaction.user, client);
      }

      user.language.value = language;
      await user.save();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              messages.languageUpdatedTitle.replace(
                "{language}",
                languageChoices[language]
              )
            )
            .setDescription(
              messages.languageUpdatedDescription
                .replace("{user}", interaction.user)
                .replace("{language}", languageChoices[language])
            )
            .setColor(config.general.botColor)
            .setFooter({
              text: "Nether Host | nether.host",
              iconURL: client.user.displayAvatarURL({ dynamic: true }),
            }),
        ],
      });
    } catch (error) {
      handleError(error);
      await interaction.reply({
        embeds: [embed.error("Failed to register. Please try again later.")],
      });
    }
  },
};
