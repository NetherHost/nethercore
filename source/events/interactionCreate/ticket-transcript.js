// Copyright 2025 Nether Host

const {
  saveTranscript,
  fetchMessages,
  formatMessages,
  sendTranscript,
} = require("../../utils/tickets/transcript.js");
const handleError = require("../../utils/handle-error.js");
const User = require("../../models/User.js");
const { loadMessages, shortLanguageCodes } = require("../../utils/language.js");
const embed = require("../../config/embed.config.js");

module.exports = async (client, interaction) => {
  if (!interaction.isButton() || interaction.customId !== "get-transcript")
    return;

  try {
    let user;
    user = await User.findOne({ "user.id": interaction.user.id });

    const language = "en-US";
    const messages = loadMessages(language);

    await interaction.reply({
      content: messages.ticketTranscriptSavingMessages,
      ephemeral: true,
    });
    const msgs = await fetchMessages(interaction.channel);
    const transcriptContent = formatMessages(msgs);
    const transcript = await saveTranscript(
      transcriptContent,
      interaction.channel,
      shortLanguageCodes[user.language.value]
    );
    await interaction.editReply({
      content: messages.ticketTranscriptSending,
      ephemeral: true,
    });

    const dmSent = interaction.user
      ? await sendTranscript(interaction.user, transcript, client, language)
      : false;

    await interaction.editReply({
      content: `${
        dmSent
          ? messages.ticketTranscriptSuccessful
          : messages.ticketTranscriptFailed
      }`,
      ephemeral: true,
    });
  } catch (error) {
    handleError(error);

    await interaction.editReply({
      embeds: [embed.error(error)],
    });
  }
};
