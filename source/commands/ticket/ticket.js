// Copyright 2025 Nether Host

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const handleError = require("../../utils/handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const { loadMessages } = require("../../utils/language.js");
const embed = require("../../config/embed.config.js");
const User = require("../../models/User.js");
const { registerUser } = require("../../utils/register-user.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Manage ticket stuff")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a user to your ticket.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to add to your ticket.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a user from your ticket.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to remove from your ticket.")
            .setRequired(true)
        )
    ),
  async execute(interaction, client) {
    await interaction.deferReply();
    const command = interaction.options.getSubcommand();
    try {
      let userData;
      userData = await User.findOne({ "user.id": interaction.user.id });

      if (!userData) {
        userData = await registerUser(interaction.user, client);
      }

      const language = userData.language.value;
      const messages = loadMessages(language);

      if (command === "add") {
        const targetUser = interaction.options.getUser("user");
        const { channel } = interaction;

        if (targetUser.id === interaction.user.id) {
          return interaction.editReply(messages.ticketCannotAddYourselfError);
        }

        if (!channel.name.toLowerCase().includes("ticket-")) {
          return interaction.editReply(messages.ticketMustBeInATicketError);
        }

        const newPermissions = {
          ViewChannel: true,
          SendMessages: true,
          AttachFiles: true,
          UseApplicationCommands: true,
          ReadMessageHistory: true,
        };

        await channel.permissionOverwrites.edit(targetUser.id, newPermissions);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                messages.ticketAddedUserTitle.replace(
                  "{username}",
                  targetUser.username
                )
              )
              .setDescription(
                messages.ticketAddedUserDescription
                  .replace("{author}", interaction.user)
                  .replace("{user}", targetUser)
              )
              .setColor(config.general.botColor)
              .setFooter({
                text: "Nether Host | nether.host",
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
              }),
          ],
        });
      } else if (command === "remove") {
        const targetUser = interaction.options.getUser("user");
        const { channel } = interaction;

        if (targetUser.id === interaction.user.id) {
          return interaction.editReply(
            messages.ticketCannotRemoveYourselfError
          );
        }

        if (!channel.name.toLowerCase().includes("ticket-")) {
          return interaction.editReply(messages.ticketMustBeInATicketError);
        }

        const newPermissions = {
          ViewChannel: false,
          SendMessages: false,
          AttachFiles: false,
          UseApplicationCommands: false,
          ReadMessageHistory: false,
        };

        await channel.permissionOverwrites.edit(targetUser.id, newPermissions);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                messages.ticketRemovedUserTitle.replace(
                  "{username}",
                  targetUser.username
                )
              )
              .setDescription(
                messages.ticketRemovedUserDescription
                  .replace("{author}", interaction.user)
                  .replace("{user}", targetUser)
              )
              .setColor(config.general.botColor)
              .setFooter({
                text: "Nether Host | nether.host",
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
              }),
          ],
        });
      }
    } catch (error) {
      handleError(error);

      await interaction.editReply({
        embeds: [embed.error(error)],
      });
    }
  },
};
