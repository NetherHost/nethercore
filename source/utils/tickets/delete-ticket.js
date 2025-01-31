// Copyright 2025 Nether Host

const User = require("../../models/User.js");
const handleError = require("../../utils/handle-error.js");
const embed = require("../../config/embed.config.js");
const { loadMessages } = require("../language.js");

async function deleteTicket(interaction, channel) {
  try {
    const users = await User.find();

    // find user data
    const user = users.find((user) =>
      user.tickets.some((ticket) => ticket.id === channel.id)
    );

    // user isnt found in db, return error
    if (!user) {
      return await interaction.reply(
        "400 Bad Request. Please try again later."
      );
    }

    const language = "en-US";
    const messages = loadMessages(language);

    // fetch ticket data
    const ticketData = user.tickets.find((ticket) => ticket.id === channel.id);

    if (!ticketData) {
      return await interaction.reply(embed.error(messages.ticketClosedError));
    }

    // check if ticket is open
    if (ticketData.status === "open") {
      return await interaction.reply({
        content: messages.ticketCannotDeleteOpenError,
        ephemeral: true,
      });
    }

    // check if ticket is deleted
    // likey wont, but may happen if the channel fails to get deleted.
    // just in case
    if (ticketData.status === "deleted") {
      return await interaction.reply({
        content: messages.ticketAlreadyDeletedError,
        ephemeral: true,
      });
    }

    // mark ticket as deleted and delete channel
    ticketData.status = "deleted";
    user.markModified("tickets");
    await user.save();

    await channel.delete();
  } catch (error) {
    handleError(error);
    await interaction.reply({
      embeds: [embed.error(error)],
    });
  }
}

module.exports = {
  deleteTicket,
};
