// Copyright 2025 Nether Host

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const JSON5 = require("json5");
const Giveaways = require("../../models/Giveaways.js");
const {
  startGiveaway,
  endGiveaway,
  getGiveawayInfo,
  listGiveaways,
  rerollGiveaway,
} = require("../../utils/giveaway.js");
const embed = require("../../config/embed.config.js");
const handleError = require("../../utils/handle-error.js");
const ms = require("ms");
const { isStaff } = require("../../utils/staff.js");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Manage giveaways")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Start a new giveaway")
        .addStringOption((option) =>
          option
            .setName("prize")
            .setDescription("The prize of the giveaway")
            .setRequired(true)
            .setMaxLength(256)
        )
        .addStringOption((option) =>
          option
            .setName("duration")
            .setDescription("The duration of the giveaway I.e '5m', '5h', '5d'")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("winners")
            .setDescription("The number of winners of the giveaway")
            .setRequired(true)
            .setMinValue(1)
        )
        .addRoleOption((option) =>
          option
            .setName("required-role")
            .setDescription("A role that is required to enter the giveaway.")
        )
        .addRoleOption((option) =>
          option
            .setName("ping-role")
            .setDescription("A role to ping on the start of the giveaway.")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("end")
        .setDescription("End an existing giveaway early")
        .addIntegerOption((option) =>
          option
            .setName("id")
            .setDescription("The ID of the giveaway to end.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all ongoing giveaways.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Get information about a specific giveaway.")
        .addIntegerOption((option) =>
          option
            .setName("id")
            .setDescription("The ID of the giveaway to get information about.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reroll")
        .setDescription("Reroll giveaway winner(s).")
        .addIntegerOption((option) =>
          option
            .setName("id")
            .setDescription("The ID of the giveaway to reroll.")
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    try {
      const command = interaction.options.getSubcommand();

      if (!isStaff(interaction.user.id)) {
        return interaction.reply({
          embeds: [
            embed.error("You do not have permission to use this command."),
          ],
          ephemeral: true,
        });
      }

      if (command === "start") {
        const prize = interaction.options.getString("prize");
        const unparsedDuration = interaction.options.getString("duration");
        const duration = ms(unparsedDuration) / 1000 || null;
        const winners = interaction.options.getInteger("winners");
        const requiredRole = interaction.options.getRole("required-role");
        const pingRole = interaction.options.getRole("ping-role");

        const durationToTimestamp = `<t:${Math.floor(
          (Date.now() + duration * 1000) / 1000
        )}:R>`;

        if (!duration) {
          return interaction.reply(
            "An invalid value for duration was provided. Please use a valid duration like: '5m', '5h', '5d'"
          );
        }

        const giveawayData = await startGiveaway(
          prize,
          duration,
          winners,
          requiredRole,
          pingRole,
          null,
          interaction.channel.id
        );
        const allGiveawayMongoData = await Giveaways.findOne({
          guildId: config.guildId,
        });

        if (!allGiveawayMongoData) {
          return interaction.reply({
            embeds: [embed.error("No giveaways data found in the database.")],
          });
        }

        const giveawayMongoData = allGiveawayMongoData.giveaways.find(
          (g) => g.id === giveawayData.id
        );

        if (!giveawayMongoData) {
          return interaction.reply({
            embeds: [embed.error("Unable to find giveaway in the database.")],
          });
        }

        const giveawayMessage = await interaction.channel.send({
          content: `${pingRole ? `<@&${pingRole.id}>` : ""}`,
          embeds: [
            new EmbedBuilder()
              .setTitle("New Giveaway 🎉")
              .setDescription(
                `A new giveaway has been started by ${interaction.user}`
              )
              .setColor(config.general.botColor)
              .addFields(
                { name: "Prize", value: `${prize}`, inline: false },
                {
                  name: "Duration",
                  value: `The giveaway will end ${durationToTimestamp}`,
                  inline: false,
                },
                {
                  name: "Entries",
                  value: `${giveawayData.participants.length}`,
                  inline: false,
                },
                {
                  name: "Required Role",
                  value: `${requiredRole ? requiredRole : "None"}`,
                  inline: false,
                }
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("Participate")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`participate-giveaway-${giveawayData.id}`),
              new ButtonBuilder()
                .setLabel("0")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
                .setCustomId(`participants-button-${giveawayData.id}`)
            ),
          ],
          allowedMentions: {
            roles: pingRole ? [pingRole.id] : [],
          },
        });

        giveawayMongoData.messageId = giveawayMessage.id;
        allGiveawayMongoData.markModified("giveaways");
        await allGiveawayMongoData.save();

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Started Giveaway ${giveawayData.id}`)
              .setDescription("You have started a new giveaway! 🎉")
              .setColor(config.general.botColor)
              .addFields(
                { name: "Prize", value: `${prize}`, inline: true },
                {
                  name: "Duration",
                  value: `The giveaway will end ${durationToTimestamp}`,
                  inline: true,
                },
                { name: "Winner Count", value: `${winners}`, inline: true },
                {
                  name: "Required Role",
                  value: `${requiredRole ? requiredRole : "None"}`,
                  inline: true,
                }
              ),
          ],
          ephemeral: true,
        });
      } else if (command === "end") {
        const id = interaction.options.getInteger("id");
        const allGiveawayData = await Giveaways.findOne({
          guildId: config.guildId,
        });
        const giveawayData = allGiveawayData.giveaways.find((g) => g.id === id);

        if (!giveawayData) {
          return interaction.reply({
            embeds: [embed.error("Unable to find giveaway in the database.")],
          });
        }

        if (giveawayData.ended) {
          return interaction.reply({
            content: `Giveaway ${id} already ended, or been ended.`,
            ephemeral: true,
          });
        }

        await endGiveaway(id);

        let giveawayMessage;
        try {
          giveawayMessage = await interaction.channel.messages.fetch(
            giveawayData.messageId
          );
        } catch (error) {
          return interaction.reply({
            embeds: [embed.error("Unable to fetch the giveaway message.")],
          });
        }

        await giveawayMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Giveaway ${id} (Ended)`)
              .setDescription(
                `This giveaway has ended early. It was ended by ${interaction.user}`
              )
              .setColor(config.general.botColor)
              .addFields(
                {
                  name: "Prize",
                  value: `${giveawayData.prize || "No Prize"}`,
                  inline: true,
                },
                {
                  name: "Winners",
                  value:
                    giveawayData.winners && giveawayData.winners.length > 0
                      ? giveawayData.winners.map((w) => `<@${w}>`).join(", ")
                      : "No winners",
                  inline: true,
                }
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("Participate")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
                .setCustomId(`participate-giveaway-${giveawayData.id}`)
            ),
          ],
        });

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Ended Giveaway ${id}`)
              .setDescription(
                `The giveaway has been forcefully ended by ${interaction.user}`
              )
              .setColor(config.general.botColor)
              .addFields([
                {
                  name: "Prize",
                  value: giveawayData.prize || "No Prize",
                  inline: true,
                },
                {
                  name: "Winners",
                  value:
                    giveawayData.winners && giveawayData.winners.length > 0
                      ? giveawayData.winners.map((w) => `<@${w}>`).join(", ")
                      : "No winners",
                  inline: true,
                },
              ]),
          ],
        });
      } else if (command === "list") {
        const ongoingGiveaways = await listGiveaways();
        if (!ongoingGiveaways || ongoingGiveaways.length === 0) {
          return interaction.reply("There are no ongoing giveaways.");
        }

        const listEmbed = new EmbedBuilder()
          .setTitle("Ongoing Giveaways")
          .setColor(config.general.botColor);

        ongoingGiveaways.forEach((giveaway) => {
          listEmbed.addFields({
            name: `Giveaway ${giveaway.id}`,
            value: `Prize: ${giveaway.prize}\nDuration: <t:${Math.floor(
              (Date.now() + giveaway.duration * 1000) / 1000
            )}:R>\nWinners: ${giveaway.winners.length}\n`,
          });
        });

        await interaction.reply({
          embeds: [listEmbed],
        });
      } else if (command === "info") {
        const id = interaction.options.getInteger("id");
        const giveawayData = await getGiveawayInfo(id);

        const durationToTimestamp = `<t:${Math.floor(
          (Date.now() + giveawayData.duration * 1000) / 1000
        )}:R>`;

        if (!giveawayData) {
          return interaction.reply({
            embeds: [embed.error("Unable to find giveaway in the database.")],
          });
        }

        const infoEmbed = new EmbedBuilder()
          .setTitle(`Giveaway ${id} Information`)
          .setColor(config.general.botColor)
          .addFields(
            {
              name: "Prize",
              value: giveawayData.prize || "No Prize",
              inline: true,
            },
            {
              name: "Duration",
              value: `Ends at: ${durationToTimestamp}`,
              inline: true,
            },
            {
              name: "Winners",
              value:
                giveawayData.winners.length > 0
                  ? giveawayData.winners.join(", ")
                  : "No winners yet",
              inline: true,
            },
            {
              name: "Required Role",
              value: giveawayData.requiredRole
                ? giveawayData.requiredRole.name
                : "None",
              inline: true,
            }
          );

        await interaction.reply({
          embeds: [infoEmbed],
        });
      } else if (command === "reroll") {
        const id = interaction.options.getInteger("id");
        const newWinners = await rerollGiveaway(id);

        if (!newWinners || newWinners.length === 0) {
          return interaction.reply({
            embeds: [embed.error("No winners to reroll.")],
          });
        }

        await interaction.reply({
          content: `New winner(s) for Giveaway ${id}: ${newWinners
            .map((winner) => `<@${winner}>`)
            .join(", ")}`,
          allowedMentions: {
            users: newWinners,
          },
        });
      }
    } catch (error) {
      handleError(error);
    }
  },
};
