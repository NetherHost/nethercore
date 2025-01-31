// Copyright 2025 Nether Host

const { closeTicket } = require("../../utils/tickets/close-ticket.js");
const handleError = require("../../utils/handle-error.js");

module.exports = async (client, interaction) => {
  if (!interaction.isButton() || interaction.customId !== "close-ticket")
    return;

  try {
    await closeTicket(interaction, client, interaction.channel);
  } catch (error) {
    handleError(error);
  }
};
