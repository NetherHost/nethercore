// Copyright 2025 Nether Host

const { unlockTicket } = require("../../utils/tickets/unlock-ticket.js");
const handleError = require("../../utils/handle-error.js");

module.exports = async (client, interaction) => {
  if (!interaction.isButton() || interaction.customId !== "unlock-ticket")
    return;

  try {
    await unlockTicket(interaction, client, interaction.channel);
  } catch (error) {
    handleError(error);
  }
};
