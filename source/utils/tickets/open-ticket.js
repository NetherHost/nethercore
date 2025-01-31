// Copyright 2025 Nether Host

const {
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} = require("discord.js");
const User = require("../../models/User.js");
const handleError = require("../../utils/handle-error.js");
const color = require("chalk");
const embed = require("../../config/embed.config.js");
const JSON5 = require("json5");
const fs = require("fs");
const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);
const { registerUser } = require("../register-user.js");
const {
  loadMessages,
  shortLanguageCodes,
  languageChoices,
} = require("../language.js");
const { getTicketAccessStatus } = require("./extra-ticket-utils.js");

const ticketCooldowns = new Map();

async function openTicket(interaction, client, user) {
  try {
    await interaction.deferReply({ ephemeral: true });

    console.log(
      color.green("[INFO] ") +
        color.white(`Opening ticket for ${interaction.user.username}...`)
    );

    //get user data
    let userData = await User.findOne({ "user.id": user.id });

    if (!userData) {
      userData = await registerUser(user, client);
    }

    const language = "en-US";
    const messages = await loadMessages(language);
    const shortLanguageCode = shortLanguageCodes[language];

    // first check for existing ticket
    const existingTicket = userData.tickets.find(
      (ticket) => ticket.status === "open"
    );

    if (existingTicket) {
      console.log(
        color.yellow("[WARN] ") +
          color.white(
            `Failed to open ticket. ${interaction.user.username} already has a ticket open!`
          )
      );

      return await interaction.editReply({
        content: messages.ticketAlreadyOpenError.replace(
          "{ticket}",
          `<#${existingTicket.id}>`
        ),
      });
    }

    //cooldown
    const cooldownTime = 30000;
    const currentTime = Date.now();
    const userCooldown = ticketCooldowns.get(user.id);

    if (userCooldown && currentTime < userCooldown) {
      return await interaction.editReply({
        content: "Please wait before creating another ticket.",
      });
    }

    ticketCooldowns.set(user.id, currentTime + cooldownTime);
    setTimeout(() => ticketCooldowns.delete(user.id), cooldownTime);

    let categoryId;

    if (language === "en-US") {
      categoryId = config.categories.tickets.englishId;
    } else if (language === "es-ES") {
      categoryId = config.categories.tickets.spanishId;
    } else {
      categoryId = config.categories.tickets.otherLangId;
    }

    // ticket types and priorities
    const types = [
      { label: "General", value: "general" },
      { label: "Technical", value: "technical" },
      { label: "Billing", value: "billing" },
      { label: "Other", value: "other" },
    ];

    const priorities = [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
    ];

    const menuOptions = types.map((type) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(type.label)
        .setValue(type.value)
    );

    const prioritiesOptions = priorities.map((priority) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(priority.label)
        .setValue(priority.value)
    );

    const categoryMenu = new StringSelectMenuBuilder()
      .setCustomId("select-category")
      .setPlaceholder(messages.ticketChooseCategory)
      .addOptions(menuOptions)
      .setMinValues(1)
      .setMaxValues(1);

    const priorityMenu = new StringSelectMenuBuilder()
      .setCustomId("select-priority")
      .setPlaceholder(messages.ticketChoosePriority)
      .addOptions(prioritiesOptions)
      .setMinValues(1)
      .setMaxValues(1);

    // status of ticket system, and user validation
    const accessStatus = await getTicketAccessStatus(interaction);
    switch (accessStatus) {
      case "DISABLED":
        return await interaction.editReply({
          content: messages.ticketSystemDisabledError,
        });
      case "CLIENT_ONLY":
        const hasClientRole = interaction.member.roles.cache.has(
          config.roles.clientRoleId
        );
        if (!hasClientRole) {
          return await interaction.editReply({
            content: messages.ticketClientOnlyError,
          });
        }
      case "EVERYONE":
        break;
    }

    // check if the user linked their account
    const linkedData = userData.link;
    if (!linkedData || !linkedData.status) {
      return await interaction.editReply({
        content: messages.ticketNotLinkedError,
      });
    }

    // check if user is ticket banned
    if (userData.ticketBanned.status) {
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(messages.ticketBannedErrorTitle)
            .setDescription(messages.ticketBannedErrorDescription)
            .addFields(
              {
                name: messages.ticketBannedFields.field1.name,
                value: messages.ticketBannedFields.field1.value.replace(
                  "{reason}",
                  userData.ticketBanned.reason
                ),
                inline: true,
              },
              {
                name: messages.ticketBannedFields.field2.name,
                value: messages.ticketBannedFields.field2.value.replace(
                  "{moderator}",
                  `<@${userData.ticketBanned.moderator}>`
                ),
                inline: true,
              }
            )
            .setColor(config.general.botColor)
            .setFooter({
              text: "Nether Host | nether.host",
              iconURL: client.user.avatarURL(),
            }),
        ],
      });
    }

    // choose ticket data, categories, etc
    const reply = await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Support")
          .setDescription(messages.ticketPrompt)
          .setColor("Red")
          .setFooter({
            text: "Nether Host | nether.host",
            iconURL: client.user.avatarURL(),
          }),
      ],
      components: [
        new ActionRowBuilder().addComponents(categoryMenu),
        new ActionRowBuilder().addComponents(priorityMenu),
      ],
      ephemeral: true,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30_000,
    });

    let selectedCategory = null;
    let selectedPriority = null;

    collector.on("collect", async (i) => {
      if (i.customId === "select-category") {
        selectedCategory = i.values[0];
      } else if (i.customId === "select-priority") {
        selectedPriority = i.values[0];
      }

      // second check for existing ticket
      const openTicket = userData.tickets.find(
        (ticket) => ticket.status === "open"
      );

      if (openTicket) {
        console.log(
          color.yellow("[WARN] ") +
            color.white(
              `Failed to open ticket. ${interaction.user.username} already has a ticket open!`
            )
        );

        return await interaction.editReply({
          content: messages.ticketAlreadyOpenError.replace(
            "{ticket}",
            `<#${openTicket.id}>`
          ),
        });
      }

      // create a ticket after selecting priority and type
      if (selectedCategory && selectedPriority) {
        const permissions = [
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.UseApplicationCommands,
            ],
          },
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: config.roles.traineeRoleId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.UseApplicationCommands,
            ],
          },
          {
            id: config.roles.supportRoleId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.UseApplicationCommands,
            ],
          },
        ];

        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: categoryId,
          permissionOverwrites: permissions,
        });

        // ticket obj and data
        const ticketObj = {
          user: {
            username: interaction.user.username,
            id: interaction.user.id,
          },
          claim: {
            status: false,
            user: null,
            claimedAt: null,
          },
          closed: {
            closedBy: null,
            closedAt: null,
          },
          id: ticketChannel.id,
          name: `ticket-${interaction.user.username}`,
          status: "open",
          language,
          priority:
            selectedPriority.charAt(0).toUpperCase() +
            selectedPriority.slice(1),
          department:
            selectedCategory.charAt(0).toUpperCase() +
            selectedCategory.slice(1),
          createdAt: Date.now(),
          attendedToAt: null,
        };

        // add ticket to db
        userData.tickets.push(ticketObj);
        await userData.save();

        // send msg in ticket
        await ticketChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle(messages.ticketMessageTitle)
              .setDescription(messages.ticketMessageDescription)
              .setColor("Red"),

            new EmbedBuilder()
              .setTitle(messages.ticketInfoMessageTitle)
              .setDescription(
                messages.ticketInfoMessageDescription
                  .replace("{user}", interaction.user)
                  .replace("{email}", linkedData.email)
                  .replace("{language}", languageChoices[language])
                  .replace("{ticketId}", ticketObj.id)
                  .replace("{priority}", ticketObj.priority)
                  .replace("{department}", ticketObj.department)
              )
              .setColor("Red")
              .setFooter({
                text: "Nether Host | nether.host",
                iconURL: client.user.avatarURL(),
              }),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel(" ")
                .setEmoji("1289398644914524253")
                .setStyle(ButtonStyle.Danger)
                .setCustomId("close-ticket")
            ),
          ],
        });

        console.log(
          color.green("[INFO] ") +
            color.white(
              `Successfully created ticket for ${interaction.user.username}...`
            )
        );

        // notify user their ticket was made
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Support")
              .setDescription(
                messages.ticketCreatedPrompt.replace("{ticket}", ticketChannel)
              )
              .setColor("Red")
              .setFooter({
                text: "Nether Host | nether.host",
                iconURL: client.user.avatarURL(),
              }),
          ],
          components: [],
          ephemeral: true,
        });

        collector.stop();
      } else {
        await i.deferUpdate();
      }
    });

    // reply with error if collector ends
    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        await interaction.followUp({
          content: messages.ticketTookTooLongError,
          ephemeral: true,
        });
      }
    });
  } catch (error) {
    handleError(error);
    await interaction.editReply({
      embeds: [embed.error(error)],
    });
  }
}

module.exports = { openTicket };
