// Copyright 2025 Nether Host

const { deleteTicket } = require("../../utils/tickets/delete-ticket.js");
const handleError = require("../../utils/handle-error.js");

module.exports = async (client, interaction) => {
  if (!interaction.isButton() || interaction.customId !== "delete-ticket")
    return;

  try {
    await deleteTicket(interaction, interaction.channel);
  } catch (error) {
    handleError(error);
  }
};
