// Copyright 2025 Nether Host

const { EmbedBuilder } = require("discord.js");
const User = require("../../models/User.js");
const handleError = require("../../utils/handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const { loadMessages } = require("../language.js");

async function changePriority(interaction, client, channel, priority) {
  try {
    const users = await User.find();

    const userData = users.find((user) =>
      user.tickets.some((ticket) => ticket.id === channel.id)
    );

    // user isnt found in db, return error
    if (!userData) {
      return await interaction.reply({
        content: "400 Bad Request. Please try again later.",
        ephemeral: true,
      });
    }

    const ticketData = userData.tickets.find(
      (ticket) => ticket.id === channel.id
    );

    const language = "en-US";
    const messages = loadMessages(language);

    // check for correct naming conventions
    if (!channel.name.includes("ticket-")) {
      return await interaction.reply({
        content: messages.ticketMustBeInATicketError,
        ephemeral: true,
      });
    }

    // return error if priority is the same
    if (ticketData.priority === priority) {
      return await interaction.reply({
        content: messages.ticketPrioritySameError.replace(
          "{priority}",
          ticketData.priority
        ),
        ephemeral: true,
      });
    }

    // return error if ticket is closed
    if (ticketData.status === "closed") {
      return await interaction.reply({
        content: messages.ticketCannotChangePriorityOfClosedError,
        ephemeral: true,
      });
    }

    ticketData.priority = priority; // update priority
    await userData.save();
  } catch (error) {
    handleError(interaction, error);
  }
}

module.exports = { changePriority };
