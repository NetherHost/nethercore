// Copyright 2025 Nether Host

const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const User = require("../../models/User.js");
const embed = require("../../config/embed.config.js");
const handleError = require("../../utils/handle-error.js");
const { addUserToStaff, removeUserFromStaff } = require("../../utils/staff.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Manage staff members.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a staff member.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to add as a staff member.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a staff member.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to remove as a staff member.")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    try {
      const command = interaction.options.getSubcommand();
      const userData = await User.findOne({ "user.id": interaction.user.id });

      if (!userData) return interaction.reply("User not found in database.");

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        return interaction.reply(
          "You do not have permission to use this command."
        );
      }

      if (command === "add") {
        const user = interaction.options.getUser("user");
        const staff = await addUserToStaff(user);
        return interaction.reply(staff);
      } else if (command === "remove") {
        const user = interaction.options.getUser("user");
        const staff = await removeUserFromStaff(user);
        return interaction.reply(staff);
      }
    } catch (error) {
      handleError(error);
      await interaction.reply({
        embeds: [embed.error(error)],
      });
    }
  },
};
