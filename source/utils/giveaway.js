// Copyright 2025 Nether Host

const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const color = require("chalk");
const Giveaways = require("../models/Giveaways.js");
const User = require("../models/User.js");
const handleError = require("./handle-error.js");
const JSON5 = require("json5");
const fs = require("fs");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

async function startGiveaway(
  prize,
  duration,
  winners,
  requiredRole,
  pingRole,
  messageId,
  channelId
) {
  try {
    const giveaway = {
      id: null,
      prize,
      duration,
      messageId,
      channelId,
      winnerCount: winners,
      requiredRole: requiredRole ? requiredRole.id : null,
      pingRole: pingRole ? pingRole.id : null,
      startTime: Date.now(),
      endTime: Date.now() + duration * 1000,
      participants: [],
      winners: [],
      ended: false,
    };

    let giveawayData = await Giveaways.findOne({ guildId: config.guildId });

    if (!giveawayData) {
      giveawayData = new Giveaways({
        guildId: config.guildId,
        totalGiveaways: 1,
        giveaways: [giveaway],
      });
      giveaway.id = giveawayData.totalGiveaways;
    } else {
      giveawayData.totalGiveaways += 1;
      giveaway.id = giveawayData.totalGiveaways;
      giveawayData.giveaways.push(giveaway);
    }

    await giveawayData.save();

    return giveaway;
  } catch (error) {
    handleError(error);
    return null;
  }
}

async function endGiveaway(id) {
  try {
    const giveawayData = await Giveaways.findOne({ guildId: config.guildId });

    if (!giveawayData) {
      return console.error(
        color.red("[ERROR] ") +
          color.white("No giveaways found for this guild.")
      );
    }

    const giveaway = giveawayData.giveaways.find((g) => g.id === id);

    if (!giveaway) {
      return console.log(
        color.yellow("[WARN] ") + color.white(`Giveaway ${id} not found.`)
      );
    }

    if (giveaway.ended) {
      return console.log(
        color.yellow("[WARN] ") + color.white(`Giveaway ${id} already ended.`)
      );
    }

    giveaway.ended = true;
    giveaway.endTime = Date.now();

    const winners = [];
    const participants = [...giveaway.participants];
    const winnerCount = Math.min(giveaway.winnerCount, participants.length);

    while (winners.length < winnerCount && participants.length > 0) {
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];

      winners.push(winner);
      participants.splice(randomIndex, 1);
    }

    giveaway.winners = winners;

    giveawayData.markModified("giveaways");
    await giveawayData.save();

    if (winners.length === 0) {
      console.log(
        color.yellow("[WARN] ") +
          color.white(
            `No winners selected for giveaway ${id} due to insufficient participants.`
          )
      );
    }
  } catch (error) {
    handleError(error);
  }
}

async function getGiveawayInfo(id) {
  try {
    const giveawayData = await Giveaways.findOne({ guildId: config.guildId });

    if (!giveawayData) {
      console.log(
        color.red("[ERROR] ") +
          color.white("No giveaways found for this guild.")
      );
      return null;
    }

    const giveaway = giveawayData.giveaways.find((g) => g.id === id);

    if (!giveaway) {
      return console.log(
        color.yellow("[WARN] ") + color.white(`Giveaway ${id} not found.`)
      );
    }

    return giveaway;
  } catch (error) {
    handleError(error);
  }
}

async function listGiveaways() {
  try {
    const giveawayData = await Giveaways.findOne({ guildId: config.guildId });

    if (!giveawayData) {
      return console.log(
        color.red("[ERROR] ") +
          color.white("No giveaways found for this guild.")
      );
    }

    if (giveawayData.giveaways.length === 0) {
      return console.log(
        color.yellow("[WARN] ") + color.white("No active giveaways.")
      );
    }

    const ongoingGiveaways = giveawayData.giveaways.filter((g) => !g.ended);

    return ongoingGiveaways;
  } catch (error) {
    handleError(error);
  }
}

async function rerollGiveaway(id) {
  try {
    const giveawayData = await Giveaways.findOne({ guildId: config.guildId });

    if (!giveawayData) {
      return console.error(
        color.red("[ERROR] ") +
          color.white("No giveaways found for this guild.")
      );
    }

    const giveaway = giveawayData.giveaways.find((g) => g.id === id);

    if (!giveaway) {
      return console.log(
        color.yellow("[WARN] ") + color.white(`Giveaway ${id} not found.`)
      );
    }

    if (!giveaway.ended) {
      return console.log(
        color.yellow("[WARN] ") +
          color.white(`Giveaway ${id} is not ended yet.`)
      );
    }

    giveaway.winners = [];

    const winners = [];
    const participants = [...giveaway.participants];
    const winnerCount = Math.min(giveaway.winnerCount, participants.length);

    while (winners.length < winnerCount && participants.length > 0) {
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];

      winners.push(winner);
      participants.splice(randomIndex, 1);
    }

    giveaway.winners = winners;

    await giveawayData.save();

    if (winners.length === 0) {
      console.log(
        color.yellow("[WARN] ") +
          color.white(
            `No winners selected for giveaway ${id} due to insufficient participants.`
          )
      );
    }

    return giveaway.winners;
  } catch (error) {
    handleError(error);
  }
}

async function participateInGiveaway(
  giveawayId,
  userId,
  messageId,
  interaction,
  durationTimestamp
) {
  try {
    const giveawayData = await Giveaways.findOne({ guildId: config.guildId });

    if (!giveawayData) {
      console.error(
        color.red("[ERROR] ") +
          color.white("No giveaways found in the database.")
      );

      return { success: false, error: "No giveaways found in the database." };
    }

    const giveaway = giveawayData.giveaways.find((g) => g.id === giveawayId);

    const userRoles = interaction.member.roles.cache.map((role) => role.id);
    const giveawayRequiresRole = giveaway.requiredRole ? true : false;

    if (!giveaway) {
      console.log(
        color.yellow("[WARN] ") +
          color.white(`Giveaway ${giveawayId} not found.`)
      );

      return { success: false, error: "That giveaway does not exist." };
    }

    if (giveaway.ended) {
      console.log(
        color.yellow("[WARN] ") +
          color.white(`Giveaway ${giveawayId} already ended.`)
      );

      return { success: false, error: "That giveaway has already ended." };
    }

    if (giveawayRequiresRole && !userRoles.includes(giveaway.requiredRole)) {
      console.log(
        color.yellow("[WARN] ") +
          color.white(
            `User ${userId} does not have the required role: ${giveaway.requiredRole}.`
          )
      );

      return {
        success: false,
        error:
          "You do not have the required role to participate in this giveaway.",
      };
    }

    if (giveaway.participants.includes(userId)) {
      giveaway.participants = giveaway.participants.filter(
        (id) => id !== userId
      );
      console.log(
        color.yellow("[INFO] ") +
          color.white(`User ${userId} removed from participation.`)
      );
    } else {
      giveaway.participants.push(userId);
      console.log(
        color.green("[INFO] ") +
          color.white(`User ${userId} added to participation.`)
      );
    }

    giveawayData.markModified("giveaways");
    await giveawayData.save();

    let giveawayMessage;
    try {
      giveawayMessage = await interaction.channel.messages.fetch(messageId);
    } catch (error) {
      console.error(
        color.red("[ERROR] ") + color.white("Unable to fetch giveaway message.")
      );
      return { success: false, error: "Unable to fetch giveaway message." };
    }
    const updatedRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Participate")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`participate-giveaway-${giveaway.id}`),
      new ButtonBuilder()
        .setLabel(`${giveaway.participants.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
        .setCustomId(`participants-button-${giveaway.id}`)
    );

    await giveawayMessage.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("New Giveaway 🎉")
          .setDescription("A new giveaway has been started!")
          .setColor(config.general.botColor)
          .addFields(
            { name: "Prize", value: `${giveaway.prize}`, inline: false },
            {
              name: "Duration",
              value: `The giveaway will end ${durationTimestamp}`,
              inline: false,
            },
            {
              name: "Entries",
              value: `${giveaway.participants.length}`,
              inline: false,
            },
            {
              name: "Required Role",
              value: `${
                giveaway.requiredRole ? giveaway.requiredRole : "None"
              }`,
              inline: false,
            }
          ),
      ],
      components: [updatedRow],
    });

    return {
      success: true,
      action: giveaway.participants.includes(userId) ? "added" : "removed",
    };
  } catch (error) {
    handleError(error);
  }
}

async function checkGiveaway(id, client) {
  try {
    const giveawayData = await Giveaways.findOne({ guildId: config.guildId });

    if (!giveawayData) {
      return console.error(
        color.red("[ERROR] ") +
          color.white("No giveaways found in the database.")
      );
    }

    let giveaway = giveawayData.giveaways.find((g) => g.id === id);

    if (!giveaway) {
      return console.log(
        color.yellow("[WARN] ") + color.white(`Giveaway ${id} not found.`)
      );
    }

    if (giveaway.ended) return;

    const currentTime = Date.now();
    const giveawayEndTime = giveaway.endTime;
    const giveawayChannel = client.channels.cache.get(giveaway.channelId);
    if (!giveawayChannel) {
      console.error(
        color.red("[ERROR] ") + color.white("Unable to find giveaway channel.")
      );
      return;
    }

    const giveawayMessage = await giveawayChannel.messages
      .fetch(giveaway.messageId)
      .catch((e) => {
        console.error(
          color.red("[ERROR] ") +
            color.white("Unable to fetch giveaway message.")
        );
        return null;
      });

    if (!giveawayMessage) {
      return;
    }

    if (currentTime >= giveawayEndTime) {
      await endGiveaway(id);

      const updatedData = await Giveaways.findOne({ guildId: config.guildId });
      giveaway = updatedData.giveaways.find((g) => g.id === id);

      if (!giveaway) {
        return console.log(
          color.yellow("[WARN] ") +
            color.white(`Giveaway ${id} not found after update.`)
        );
      }

      const embed = new EmbedBuilder()
        .setTitle("Giveaway Ended 🎉")
        .setDescription("This giveaway has ended.")
        .setColor(config.general.botColor)
        .addFields(
          { name: "🎁 Prize", value: `${giveaway.prize}`, inline: false },
          {
            name: "👑 Winner(s)",
            value: giveaway.winners.length
              ? `${giveaway.winners.map((w) => `<@${w}>`).join(", ")}`
              : "No winners...",
            inline: false,
          }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Participate")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`participate-giveaway-${giveaway.id}`)
          .setDisabled(true)
      );

      const message = await giveawayMessage.edit({
        embeds: [embed],
        components: [row],
      });

      await message.reply({
        content: giveaway.winners.length
          ? `Congratulations to the winners: ${giveaway.winners
              .map((w) => `<@${w}>`)
              .join(", ")}`
          : "There were not enough participants to determine a winner(s).",
        allowedMentions: {
          users: giveaway.winners,
        },
      });
    }
  } catch (error) {
    handleError(error);
  }
}

module.exports = {
  startGiveaway,
  endGiveaway,
  getGiveawayInfo,
  listGiveaways,
  rerollGiveaway,
  participateInGiveaway,
  checkGiveaway,
};
