// Copyright 2025 Nether Host

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const handleError = require("../../utils/handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");
const { translate } = require("../../utils/ai.js");

const embed = require("../../config/embed.config.js");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("translate")
    .setDescription("Translate text to a different language.")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text to translate.")
        .setRequired(true)
        .setMaxLength(2000)
    )
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("The language to translate to.")
        .setRequired(true)
        .setMaxLength(32)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const text = interaction.options.getString("text");
      const language = interaction.options.getString("language");

      const translation = await translate(text, language);

      if (
        translation ===
        "Failed to generate a response from OpenAI. Please try again later."
      ) {
        return await interaction.editReply(translation);
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Translation into ${language}`)
            .setDescription("Here is the translation: ")
            .setColor(config.general.botColor)
            .setFooter({
              text: "Nether Host | nether.host",
              iconURL: client.user.displayAvatarURL({ dynamic: true }),
            })
            .addFields(
              {
                name: "Original Text",
                value: text,
              },
              {
                name: "Translation",
                value: translation,
              }
            ),
        ],
      });
    } catch (error) {
      handleError(error);
      await interaction.editReply(embed.error(error));
    }
  },
};
