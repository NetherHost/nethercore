// Copyright 2025 Nether Host

const { getSettings } = require("../settings.js");
const handleError = require("../handle-error.js");

async function ticketAccess(interaction, value) {
  try {
    const settings = await getSettings(interaction);

    settings.tickets.access = value;
    settings.markModified("tickets.access");
    await settings.save();
  } catch (error) {
    handleError(error, interaction);
  }
}

module.exports = { ticketAccess };
