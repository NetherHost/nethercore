// Copyright 2025 Nether Host

const {
  participateInGiveaway,
  getGiveawayInfo,
} = require("../../utils/giveaway");
const handleError = require("../../utils/handle-error.js");

module.exports = async (client, interaction) => {
  if (
    !interaction.isButton() ||
    !interaction.customId.startsWith("participate-giveaway-")
  ) {
    return;
  }

  const giveawayId = parseInt(interaction.customId.split("-")[2]);
  const userId = interaction.user.id;

  const giveawayData = await getGiveawayInfo(giveawayId);

  const durationToTimestamp = `<t:${Math.floor(
    (Date.now() + giveawayData.duration * 1000) / 1000
  )}:R>`;

  try {
    const result = await participateInGiveaway(
      giveawayId,
      userId,
      interaction.message.id,
      interaction,
      durationToTimestamp
    );

    if (result.success) {
      const actionMessage =
        result.action === "added"
          ? "You have successfully joined the giveaway!"
          : "You have successfully left the giveaway.";

      await interaction.reply({ content: actionMessage, ephemeral: true });
    } else if (result.success === false) {
      await interaction.reply({
        content: result.error,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Something went wrong. Please try again later.",
        ephemeral: true,
      });
    }
  } catch (error) {
    handleError(error);
  }
};
