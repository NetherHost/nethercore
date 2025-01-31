// Copyright 2025 Nether Host

const { SlashCommandBuilder } = require("discord.js");
const { ask } = require("../../utils/ai.js");
const handleError = require("../../utils/handle-error.js");
const { isStaff } = require("../../utils/staff.js");
const { loadMessages } = require("../../utils/language.js");
const User = require("../../models/User.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the AI a question.")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The question or prompt for the AI.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("The language to use for the response.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("max_tokens")
        .setDescription("Maximum number of tokens for the response.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("context")
        .setDescription("Context for the AI to consider.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("model")
        .setDescription("The AI model to use. Defaults to gpt-4o-mini.")
        .setRequired(false)
        .addChoices(
          { name: "gpt-4o", value: "gpt-4o" },
          { name: "gpt-4o-mini", value: "gpt-4o-mini" },
          { name: "gpt-3.5-turbo", value: "gpt-3.5-turbo" },
          { name: "gpt-4o-2024-11-20", value: "gpt-4o-2024-11-20" },
          { name: "gpt-4o-mini-2024-07-18", value: "gpt-4o-mini-2024-07-18" },
          { name: "o1-mini", value: "o1-mini" }
        )
    ),
  async execute(interaction) {
    try {
      let userData;
      userData = await User.findOne({ "user.id": interaction.user.id });

      if (!userData) {
        userData = await registerUser(interaction.user, client);
      }

      const language = userData.language.value;
      const messages = loadMessages(language);

      if (!isStaff(interaction.user.id)) {
        return interaction.reply({
          content: messages.noPermissionError,
          ephemeral: true,
        });
      }

      const languageToUse = interaction.options.getString("language");
      const maxTokens = interaction.options.getInteger("max_tokens") || 512;
      const context = interaction.options.getString("context") || "";
      const model = interaction.options.getString("model") || "gpt-4o-mini";
      const prompt = interaction.options.getString("prompt");

      const response = await ask(
        prompt,
        languageToUse,
        context,
        model,
        maxTokens
      );
      await interaction.reply({ content: response.content });
    } catch (error) {
      handleError(error);
      await interaction.reply({
        content:
          "Failed to generate a response from OpenAI. Please try again later.",
      });
    }
  },
};
