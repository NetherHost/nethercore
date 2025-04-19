// Copyright 2025 Nether Host

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const embed = require("../../config/embed.config.js");
const handleError = require("../../utils/handle-error.js");
const {
  isStaff,
  getStaffTicketStatistics,
  buildLeaderboard,
  createStaffStatisticsLeaderboard,
} = require("../../utils/staff.js");
const { loadMessages } = require("../../utils/language.js");
const User = require("../../models/User.js");
const JSON5 = require("json5");
const fs = require("fs");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Get support statistics.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("statistics")
        .setDescription("Get support statistics for a specific user.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want statistics for.")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("Get the support statistics leaderboard.")
    ),

  async execute(interaction, client) {
    const command = interaction.options.getSubcommand();

    if (!isStaff(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          embed.error("You do not have permission to use this command."),
        ],
        ephemeral: true,
      });
    }

    let userData;
    userData = await User.findOne({ "user.id": interaction.user.id });

    if (!userData) {
      userData = await registerUser(interaction.user, client);
    }

    const language = "en-US";
    const messages = loadMessages(language);

    if (command === "statistics") {
      try {
        const user = interaction.options.getUser("user") || interaction.user;
        const staffData = await getStaffTicketStatistics(user);

        if (!staffData) {
          return interaction.reply({
            embeds: [embed.error(messages.notFoundOnStaffTeam)],
            ephemeral: true,
          });
        }

        const embedMsg = new EmbedBuilder()
          .setTitle(
            messages.supportStatsTitle.replace("{username}", user.username)
          )
          .setDescription(
            messages.supportStatsDescription.replace("{user}", user)
          )
          .setColor(config.general.botColor)
          .addFields(
            {
              name: messages.supportStatsFields.field1.name,
              value: messages.supportStatsFields.field1.value.replace(
                "{messages}",
                staffData.staff.ticketMessages
              ),
              inline: true,
            },
            {
              name: messages.supportStatsFields.field2.name,
              value: messages.supportStatsFields.field2.value.replace(
                "{closed}",
                staffData.staff.ticketsClosed
              ),
              inline: true,
            }
          )
          .setFooter({
            text: "Nether Host | nether.host",
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          });

        await interaction.reply({ embeds: [embedMsg] });
      } catch (error) {
        handleError(error);
        await interaction.reply(embed.error(error));
      }
    } else if (command === "leaderboard") {
      try {
        const statistics = await createStaffStatisticsLeaderboard();
        const leaderboardEmbed = buildLeaderboard(statistics, messages, client);

        await interaction.reply({ embeds: [leaderboardEmbed] });
      } catch (error) {
        handleError(error);
        await interaction.reply(embed.error(error));
      }
    }
  },
};
