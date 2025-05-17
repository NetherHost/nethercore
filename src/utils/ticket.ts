import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  Client,
  ComponentType,
  EmbedBuilder,
  Guild,
  GuildMember,
  MessageFlags,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from "discord.js";
import Tickets from "../models/Tickets";
import TicketSettings from "../models/TicketSettings";
import User from "../models/User";
import {
  type Ticket as TicketProps,
  type User as UserProps,
} from "../../types/global";

interface OpenTicketProps {
  interaction: ButtonInteraction;
  client: Client;
}

class Ticket {
  constructor() {}

  public async open({ interaction, client }: OpenTicketProps) {
    try {
      const guild = interaction.guild as Guild;
      const member = interaction.member as GuildMember;
      const userData = await User.findOne({ userId: interaction.user.id });
      const ticketSettings = await TicketSettings.findOne();

      if (!userData)
        return interaction.reply({
          content: `404 Not Found: \`UserDocument for ${interaction.user.id} not found in remote database.\``,
          flags: [MessageFlags.Ephemeral],
        });

      switch (ticketSettings?.access) {
        case "EVERYONE":
          // do nothing
          break;

        case "CLIENTS_ONLY":
          if (!member?.roles.cache.has("1288653045453819934")) {
            return interaction.reply({
              content: `403 Forbidden: \`Only users with the "Client" role can open tickets at this time.\``,
              ephemeral: true,
            });
          }
          break;

        case "CLOSED":
          return interaction.reply({
            content: `403 Forbidden: \`Ticket creation is currently disabled.\``,
            ephemeral: true,
          });

        default:
          return interaction.reply({
            content: `500 Internal Server Error: \`TicketSettingsDocument not found or invalid.\``,
            ephemeral: true,
          });
      }

      const ticketBanned = ticketSettings.ticketBanList?.find(
        (ban) => ban.userId === interaction.user.id
      );

      if (ticketBanned)
        return interaction.reply({
          content: `403 Forbidden: You are banned from opening tickets.\n\n**Reason:** ${
            ticketBanned.reason || "No reason provided."
          }\n**Banned At:** <t:${Math.floor(
            ticketBanned.bannedAt.getTime() / 1000
          )}:F>`,
          ephemeral: true,
        });

      if (!userData.linked.isLinked)
        return interaction.reply({
          content: `403 Forbidden: \`Your account must be linked to open a ticket.\``,
          flags: [MessageFlags.Ephemeral],
        });

      const existingTicket: TicketProps | null = await Tickets.findOne({
        userId: interaction.user.id,
        status: "open",
      });

      if (existingTicket)
        return interaction.reply({
          content: `409 Conflict: \`You already have a ticket open.\` - <#${existingTicket.ticketId}>`,
        });

      const departments = [
        { label: "General", value: "general" },
        { label: "Technical", value: "technical" },
        { label: "Billing", value: "billing" },
        { label: "Other", value: "other" },
      ];

      const menuOptions = departments.map((d) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(d.label)
          .setValue(d.value);
      });

      const menu = new StringSelectMenuBuilder()
        .setCustomId("select-department")
        .setPlaceholder("Select a department...")
        .addOptions(menuOptions)
        .setMinValues(1)
        .setMaxValues(1);

      const reply = await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Open a Ticket")
            .setDescription(
              `Please select an option from the dropdown menu below to continue to your ticket.`
            )
            .setColor("Red"),
        ],
        components: [new ActionRowBuilder().addComponents(menu).toJSON()],
        flags: [MessageFlags.Ephemeral],
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 20_000,
      });

      collector.on("collect", async (i) => {
        const selectedDepartment = i.values[0];

        if (existingTicket)
          return interaction.reply({
            content: `409 Conflict: \`You already have a ticket open.\``,
          });

        if (!selectedDepartment) await i.deferUpdate();

        const defaultAllowPerms = [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.UseApplicationCommands,
        ];

        const permissions = [
          {
            id: interaction.user.id,
            allow: defaultAllowPerms,
          },
          {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          ...["1288652951992139919", "1288652975413133407"].map((roleId) => ({
            id: roleId,
            allow: defaultAllowPerms,
          })),
        ];

        const ticketChannel = await guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: "1288653678806569032",
          permissionOverwrites: permissions,
        });

        const newTicket = new Tickets({
          userId: interaction.user.id,
          ticketId: ticketChannel.id,
          name: ticketChannel.name,
          status: "open",
          department: selectedDepartment,
          claim: {
            status: false,
          },
          timestamps: {
            createdAt: new Date(),
          },
        });

        if (ticketSettings && typeof ticketSettings.totalTickets === "number") {
          ticketSettings.totalTickets++;
        }

        await ticketSettings.save();
        await newTicket.save();

        await ticketChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Support Ticket ${ticketSettings.totalTickets}`)
              .setDescription(
                `Thank you for opening a ticket, ${interaction.user}. Staff will be with you shortly.\n\nIn the meantime, please describe your issue in detail. Provide logs, screenshots, or other information you believe will assist us.`
              )
              .setColor("Red"),
            new EmbedBuilder()
              .setTitle("Ticket Information")
              .setDescription(
                "Here is some information about the ticket and its creator:"
              )
              .addFields(
                {
                  name: "User",
                  value: `${interaction.user}`,
                },
                {
                  name: "Email",
                  value: `${userData.linked.email ?? "Unknown"}`,
                },
                {
                  name: "Ticket ID",
                  value: `${newTicket.ticketId}`,
                },
                {
                  name: "Department",
                  value: `${newTicket.department}`,
                }
              )
              .setColor("Red")
              .setTimestamp(),
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel("Close")
                  .setCustomId("ticket-close-button")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setLabel("Staff")
                  .setCustomId("ticket-staff-panel-button")
                  .setStyle(ButtonStyle.Secondary)
              )
              .toJSON(),
          ],
        });

        await i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Open a Ticket")
              .setDescription(
                `Your ticket has been created at ${ticketChannel}`
              )
              .setColor("Red"),
          ],
          components: [],
        });

        collector.stop();
      });
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
    }
  }
}
