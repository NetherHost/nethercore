// Copyright 2025 Nether Host

const {
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const User = require("../../models/User.js");
const handleError = require("../../utils/handle-error.js");
const embed = require("../../config/embed.config.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const { loadMessages } = require("../language.js");
const { isStaff } = require("../staff.js");

async function unlockTicket(interaction, client, channel) {
  try {
    const users = await User.find();

    const user = users.find((user) =>
      user.tickets.some((ticket) => ticket.id === channel.id)
    );

    // user isnt found in db, return error
    if (!user) {
      return await interaction.reply(
        "400 Bad Request. Please try again later."
      );
    }

    // only staff may unlock tickets
    // throw error if user is not staff (source/config/staff.json5)
    if (!isStaff(interaction.user.id)) {
      return await interaction.reply({
        content: "Only staff may unlock your ticket.",
        ephemeral: true,
      });
    }

    const language = "en-US";
    const messages = loadMessages(language);

    const ticketData = user.tickets.find((ticket) => ticket.id === channel.id);

    if (!ticketData) {
      return await interaction.reply(embed.error(messages.ticketUnlockError));
    }

    // if ticket is already open, throw error
    if (ticketData.status === "open") {
      return await interaction.reply({
        content: messages.ticketUnlockAlreadyOpenError,
        ephemeral: true,
      });
    }

    // update ticket status and user permissions
    ticketData.status = "open";
    ticketData.closed = { closedBy: null, closedAt: null };
    user.markModified("tickets");
    await user.save();

    await channel.permissionOverwrites.edit(ticketData.user.id, {
      SendMessages: true,
      AddReactions: true,
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId("close-ticket")
        .setLabel(" ")
        .setEmoji("1289398644914524253")
    );

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle(messages.ticketUnlockedTitle)
          .setDescription(
            messages.ticketUnlockedDescription.replace(
              "{user}",
              interaction.user
            )
          )
          .setColor(config.general.botColor)
          .setFooter({
            text: "Nether Host | nether.host",
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          }),
      ],
      components: [row],
    });
  } catch (error) {
    handleError(error);
    await interaction.reply({
      embeds: [embed.error(error)],
    });
  }
}

module.exports = { unlockTicket };
