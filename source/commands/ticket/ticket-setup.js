// Copyright 2025 Nether Host

const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  ChannelType,
} = require("discord.js");
const handleError = require("../../utils/handle-error.js");
const fs = require("fs");
const JSON5 = require("json5");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const { isStaff } = require("../../utils/staff.js");
const embed = require("../../config/embed.config.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("Setup the ticket system for NetherCore")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel you want the ticket system to be in.")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    ),

  async execute(interaction, client) {
    try {
      if (!isStaff(interaction.user.id)) {
        return interaction.reply({
          embeds: [
            embed.error("You do not have permission to use this command."),
          ],
          ephemeral: true,
        });
      }

      const channel = interaction.options.getChannel("channel");
      const ticketEmbed = new EmbedBuilder()
        .setTitle("Official Support | Nether Host")
        .setDescription(
          "Press the button below to open a ticket. You will be prompted to a private channel where you can privately speak with the support team of Nether Host."
        )
        .setColor(config.general.botColor)
        .addFields({
          name: "Language",
          value:
            "When you open a ticket, the language chosen with `/language` will be used. No need to be confused over multiple buttons.",
        })
        .setFooter({
          text: "Nether Host | nether.host",
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("New Ticket")
          .setCustomId("open-ticket")
          .setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ embeds: [ticketEmbed], components: [row] });
      await interaction.reply({
        content: `Sucessfully sent ticket message to ${channel}`,
        ephemeral: true,
      });
    } catch (error) {
      handleError(error);
      await interaction.reply({
        embeds: [embed.error(error)],
      });
    }
  },
};
