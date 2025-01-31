// Copyright 2025 Nether Host

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User.js");
const handleError = require("../../utils/handle-error.js");
const { getServerStatus } = require("../../utils/server-status.js");
const { registerUser } = require("../../utils/register-user.js");
const JSON5 = require("json5");
const fs = require("fs");

const embed = require("../../config/embed.config.js");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

const domainRegex =
  /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/;
const ipRegex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/; // Validates IPv4 addresses

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Check the status of a Minecraft server.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("java")
        .setDescription("Check the status of a Minecraft: Java Edition server.")
        .addStringOption((option) =>
          option
            .setName("ip")
            .setDescription("The IP address or domain of the server.")
            .setRequired(true)
            .setMaxLength(128)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bedrock")
        .setDescription(
          "Check the status of a Minecraft: Bedrock Edition server."
        )
        .addStringOption((option) =>
          option
            .setName("ip")
            .setDescription("The IP address or domain of the server.")
            .setRequired(true)
            .setMaxLength(128)
        )
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const command = interaction.options.getSubcommand();
      const ip = interaction.options.getString("ip");

      // Validate if the input is a valid IP or domain
      if (!domainRegex.test(ip) && !ipRegex.test(ip)) {
        return await interaction.editReply({
          content:
            "Invalid IP address or domain. Please provide a valid IP address (IPv4) or domain.",
          ephemeral: true,
        });
      }

      let userData = await User.findOne({ "user.id": interaction.user.id });
      if (!userData) {
        userData = await registerUser(interaction.user);
      }

      // Fetch server status
      const data = await getServerStatus(ip, command);

      const statusEmbed = new EmbedBuilder()
        .setTitle(`Server Status | ${ip}`)
        .setColor(config.general.botColor)
        .setFooter({
          text: "Nether Host | nether.host",
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        });

      // Even if the server is offline, show some data
      if (data && data.ip) {
        statusEmbed.addFields(
          { name: "IP:Port", value: `${data.ip}:${data.port}`, inline: true },
          {
            name: "Version",
            value: data?.protocol?.name ? `${data.protocol.name}` : "Unknown",
            inline: true,
          }
        );
      }

      if (!data || !data.online) {
        statusEmbed.addFields({
          name: "Status",
          value: "<:offline:1292310905530482701> Offline",
          inline: false,
        });

        return await interaction.editReply({
          content: "Server is offline, but here's what we could find.",
          embeds: [statusEmbed],
        });
      }

      // Add server details when online
      statusEmbed.addFields(
        {
          name: "Status",
          value: "<:online:1292310904725176331> Online",
          inline: true,
        },
        {
          name: "Players",
          value: `${data.players.online} / ${data.players.max}`,
          inline: true,
        },
        {
          name: "MOTD",
          value: `\`\`\`${data.motd.clean || "No MOTD available."}\`\`\``,
          inline: false,
        }
      );

      await interaction.editReply({ embeds: [statusEmbed] });
    } catch (error) {
      handleError(error);
      await interaction.reply({
        embeds: [embed.error(error)],
      });
    }
  },
};
