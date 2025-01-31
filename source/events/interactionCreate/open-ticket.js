// Copyright 2025 Nether Host

const { openTicket } = require("../../utils/tickets/open-ticket.js");
const handleError = require("../../utils/handle-error.js");

module.exports = async (client, interaction) => {
  if (!interaction.isButton() || interaction.customId !== "open-ticket") return;

  try {
    await openTicket(interaction, client, interaction.user);
  } catch (error) {
    handleError(error);
  }
};
