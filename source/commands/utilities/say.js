// Copyright 2025 Nether Host

const { SlashCommandBuilder, ChannelType } = require("discord.js");
const color = require("chalk");
const embed = require("../../config/embed.config.js");
const handleError = require("../../utils/handle-error.js");
const { isStaff } = require("../../utils/staff.js");
const JSON5 = require("json5");
const fs = require("fs");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make NetherCore say something.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message you want NetherCore to say.")
        .setRequired(true)
        .setMaxLength(2000)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "The channel you want NetherCore to send the message in."
        )
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .addBooleanOption((option) =>
      option
        .setName("anonymous")
        .setDescription(
          "Wether or not the message should show who it was ran by."
        )
        .setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      const message = interaction.options.getString("message");
      const channel = interaction.options.getChannel("channel");
      const anonymous = interaction.options.getBoolean("anonymous");

      if (!isStaff(interaction.user.id)) {
        return interaction.reply({
          embeds: [
            embed.error("You do not have permission to use this command."),
          ],
          ephemeral: true,
        });
      }

      if (channel) {
        if (anonymous) {
          await channel.send(`${message}`);
          await interaction.reply({
            content: `Sent message to ${channel}.`,
            ephemeral: true,
          });
        } else {
          await channel.send(`Sent by ${interaction.user}\n\n${message}`);
          await interaction.reply({
            content: `Sent message to ${channel}.`,
            ephemeral: true,
          });
        }
      } else {
        if (anonymous) {
          await interaction.channel.send(message);
          await interaction.reply({
            content: "Sent message.",
            ephemeral: true,
          });
        } else {
          await interaction.reply(message);
        }
      }
    } catch (error) {
      handleError(error);

      await interaction.reply({
        embeds: [embed.error(error)],
      });
    }
  },
};
