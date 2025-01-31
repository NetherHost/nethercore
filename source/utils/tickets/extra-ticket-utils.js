// Copyright 2025 Nether Host

const { getSettings } = require("../settings.js");
const handleError = require("../handle-error.js");

async function getTicketAccessStatus(interaction) {
  try {
    const settings = await getSettings(interaction);
    return settings.tickets.access;
  } catch (error) {
    handleError(error, interaction);
  }
}

async function getTicketAutocloseStatus(interaction) {
  try {
    const settings = await getSettings(interaction);
    return settings.tickets.autoClose.enabled;
  } catch (error) {
    handleError(error, interaction);
  }
}

module.exports = { getTicketAccessStatus, getTicketAutocloseStatus };
