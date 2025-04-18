const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const os = require("os");
const { version } = require("../../../package.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("health")
    .setDescription("Check the health of the NetherCore bot"),
  async execute(interaction, client) {
    await interaction.deferReply();

    const formatUptime = (ms) => {
      const seconds = Math.floor(ms / 1000) % 60;
      const minutes = Math.floor(ms / (1000 * 60)) % 60;
      const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const formatBytes = (bytes) => {
      const mb = bytes / 1024 / 1024;
      return `${mb.toFixed(2)} MB`;
    };

    const createEmbed = async () => {
      const apiPing = Math.round(client.ws.ping);

      const memoryUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();

      const cpuLoad = os.loadavg()[0]; // load avg over 60s

      return new EmbedBuilder()
        .setTitle("🩺 NetherCore Bot Health")
        .setColor("#43B581")
        .setFields(
          {
            name: "Version",
            value: `${version}`,
          },
          {
            name: "API Ping",
            value: `\`\`\`${apiPing}ms\`\`\``,
            inline: true,
          },
          {
            name: "Uptime",
            value: `\`\`\`${formatUptime(client.uptime)}\`\`\``,
            inline: true,
          },
          {
            name: "Memory (RSS)",
            value: `\`\`\`${formatBytes(memoryUsage.rss)}\`\`\``,
            inline: true,
          },
          {
            name: "Memory (Heap Used)",
            value: `\`\`\`${formatBytes(memoryUsage.heapUsed)}\`\`\``,
            inline: true,
          },
          {
            name: "CPU Load (1m avg)",
            value: `\`\`\`${cpuLoad.toFixed(2)}\`\`\``,
            inline: true,
          }
        )
        .setFooter({
          text: `Checked at`,
        })
        .setTimestamp();
    };

    const recheckButton = new ButtonBuilder()
      .setCustomId("health-recheck")
      .setLabel("Refresh")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(recheckButton);

    const embed = await createEmbed(interaction);
    const message = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        return buttonInteraction.reply({
          content:
            "Only the user who ran the command can recheck the bot's health.",
          ephemeral: true,
        });
      }

      await buttonInteraction.deferUpdate();
      const updatedEmbed = await createEmbed(buttonInteraction);
      await interaction.editReply({ embeds: [updatedEmbed] });
    });

    collector.on("end", async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        recheckButton.setDisabled(true)
      );

      await interaction.editReply({ components: [disabledRow] });
    });
  },
};
