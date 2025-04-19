// Copyright 2025 Nether Host

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const handleError = require("../../utils/handle-error.js");
const { loadMessages } = require("../../utils/language.js");
const { isStaff } = require("../../utils/staff.js");
const embed = require("../../config/embed.config.js");
const User = require("../../models/User.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-ban")
    .setDescription("Ban a member from the ticket system.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Ban a member from the ticket system.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to ban from the ticket system.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for the ban.")
            .setRequired(false)
            .setMaxLength(256)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Unban a member from the ticket system.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription(
              "The user you want to unban from the ticket system."
            )
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    try {
      const command = interaction.options.getSubcommand();
      const user = interaction.options.getUser("user");
      const reason =
        interaction.options.getString("reason") || "No Reason Provided";

      let userData = await User.findOne({ "user.id": interaction.user.id });
      if (!userData) {
        userData = await registerUser(interaction.user, client);
      }

      const language = "en-US";
      const messages = loadMessages(language);

      if (!isStaff(interaction.user.id)) {
        return interaction.reply({
          content: messages.noPermissionError,
          ephemeral: true,
        });
      }

      if (command === "add") {
        if (user.id === interaction.user.id) {
          return interaction.reply({
            content: messages.ticketCannotBanYourselfError,
            ephemeral: true,
          });
        }

        if (isStaff(user.id)) {
          return interaction.reply({
            content: messages.ticketCannotBanStaffError,
            ephemeral: true,
          });
        }

        const targetUserData = await User.findOne({ "user.id": user.id });
        if (!targetUserData) {
          return interaction.reply({
            content: messages.ticketCannotBanUserError.replace("{user}", user),
            ephemeral: true,
          });
        }

        if (targetUserData.ticketBanned.status) {
          return interaction.reply({
            content: messages.ticketAlreadyBannedError,
            ephemeral: true,
          });
        }

        targetUserData.ticketBanned.status = true;
        targetUserData.ticketBanned.reason = reason;
        targetUserData.ticketBanned.moderator = interaction.user.id;
        targetUserData.save();

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                messages.ticketBannedTitle.replace("{username}", user.username)
              )
              .setDescription(
                messages.ticketBannedDescription.replace("{user}", user)
              )
              .setColor(config.general.botColor)
              .addFields(
                {
                  name: messages.ticketBannedFields.field1.name,
                  value: messages.ticketBannedFields.field1.value.replace(
                    "{reason}",
                    reason
                  ),
                  inline: true,
                },
                {
                  name: messages.ticketBannedFields.field2.name,
                  value: messages.ticketBannedFields.field2.value.replace(
                    "{moderator}",
                    interaction.user
                  ),
                  inline: true,
                }
              )
              .setFooter({
                text: "Nether Host | nether.host",
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
              }),
          ],
        });
      } else if (command === "remove") {
        if (user.id === interaction.user.id) {
          return interaction.reply({
            content: messages.ticketCannotUnbanYourselfError,
            ephemeral: true,
          });
        }

        const targetUserData = await User.findOne({ "user.id": user.id });
        if (!targetUserData) {
          return interaction.reply({
            content: messages.ticketCannotUnbanUserError.replace(
              "{user}",
              user
            ),
            ephemeral: true,
          });
        }

        if (!targetUserData.ticketBanned.status) {
          return interaction.reply({
            content: messages.ticketNotBannedError.replace("{user}", user),
            ephemeral: true,
          });
        }

        targetUserData.ticketBanned.status = false;
        targetUserData.ticketBanned.reason = null;
        targetUserData.ticketBanned.moderator = null;
        targetUserData.save();

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                messages.ticketUnbannedTitle.replace(
                  "{username}",
                  user.username
                )
              )
              .setDescription(
                messages.ticketUnbannedDescription.replace("{user}", user)
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
      await interaction.reply(embed.error(error));
    }
  },
};
