// Copyright 2025 Nether Host

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const { ticketAccess } = require("../../utils/tickets/access.js");
const handleError = require("../../utils/handle-error.js");
const User = require("../../models/User.js");
const JSON5 = require("json5");
const fs = require("fs");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Manage settings for NetherCore.")
    .addSubcommandGroup((group) =>
      group
        .setName("tickets")
        .setDescription("Manage ticket settings.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("access")
            .setDescription("Manage ticket access settings.")
            .addStringOption((option) =>
              option
                .setName("value")
                .setDescription("Choose who can access the ticket system.")
                .setRequired(true)
                .addChoices(
                  { name: "Disabled", value: "DISABLED" },
                  { name: "Client Only", value: "CLIENT_ONLY" },
                  { name: "Everyone", value: "EVERYONE" }
                )
            )
        )
    ),

  async execute(interaction, client) {
    const group = interaction.options.getSubcommandGroup();
    const command = interaction.options.getSubcommand();

    try {
      let user;
      user = await User.findOne({ "user.id": interaction.user.id });

      if (!user) {
        user = await registerUser(interaction.user, client);
      }

      if (group === "tickets") {
        if (command === "access") {
          if (
            !interaction.member.permissions.has(
              PermissionsBitField.Flags.Administrator
            )
          ) {
            return await interaction.reply({
              content: messages.noPermissionError,
              ephemeral: true,
            });
          }

          const value = interaction.options.getString("value");
          await ticketAccess(interaction, value);

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("Ticket Settings Updated")
                .setDescription("Ticket access settings have been updated.")
                .setColor(config.general.botColor)
                .addFields({
                  name: "New Value",
                  value: `${value}` || "Error showing value",
                  inline: true,
                })
                .setFooter({
                  text: `Nether Host | nether.host`,
                  iconURL: client.user.displayAvatarURL({
                    dynamic: true,
                  }),
                }),
            ],
          });
        }
      }
    } catch (error) {
      handleError(error);
    }
  },
};
