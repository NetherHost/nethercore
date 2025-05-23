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
  NewsChannel,
} from "discord.js";
import Tickets from "../../models/Tickets";
import TicketSettings from "../../models/TicketSettings";
import User from "../../models/User";
import {
  type Ticket as TicketProps,
  type User as UserProps,
} from "../../../types/global";
import config from "../../config";
import { checkUserLinked } from "../../utils/api";

interface OpenTicketProps {
  interaction: ButtonInteraction;
  client: Client;
}

class OpenTicket {
  constructor() {}

  public async open({
    interaction,
    client,
  }: OpenTicketProps): Promise<unknown> {
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
              flags: [MessageFlags.Ephemeral],
            });
          }
          break;

        case "CLOSED":
          return interaction.reply({
            content: `403 Forbidden: \`Ticket creation is currently disabled.\``,
            flags: [MessageFlags.Ephemeral],
          });

        default:
          const newTicketSettings = new TicketSettings();
          await newTicketSettings.save();
          return interaction.reply({
            content: `500 Internal Server Error: \`A new TicketSetttings document was created. Please press the button again.\``,
            flags: [MessageFlags.Ephemeral],
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
          flags: [MessageFlags.Ephemeral],
        });

      let apiResponse: Awaited<ReturnType<typeof checkUserLinked>> = {
        success: true,
        linked: true,
        user: {
          id: 0,
          username: "development",
          email: "development@nether.host",
        },
      };

      if (process.env.NODE_ENV === "production") {
        apiResponse = await checkUserLinked(interaction.user.id);

        if (!apiResponse.success || !apiResponse.linked) {
          return interaction.reply({
            content: `403 Forbidden: \`Your account must be linked to open a ticket.\`\n\nPlease link your account at https://nether.host/link-discord`,
            flags: [MessageFlags.Ephemeral],
          });
        }
      }

      const existingTicket: TicketProps | null = await Tickets.findOne({
        userId: interaction.user.id,
        status: "open",
      });

      if (existingTicket)
        return interaction.reply({
          content: `409 Conflict: \`You already have a ticket open.\` - <#${existingTicket.ticketId}>`,
          flags: [MessageFlags.Ephemeral],
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
        fetchReply: true,
        components: [new ActionRowBuilder().addComponents(menu).toJSON()],
        flags: [MessageFlags.Ephemeral],
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 20_000,
      });

      collector.on("collect", async (i) => {
        if (i.customId !== "select-department")
          return console.log("Did not find interaction");
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
          ...config.staff.staffRoleIds.map((id: string) => ({
            id,
            allow: defaultAllowPerms,
          })),
        ];

        const ticketChannel = await guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: config?.tickets?.parentCategoryId,
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

        let formattedTime = "Not available";
        if (ticketSettings.stats && ticketSettings.stats.averageResponseTime) {
          const averageMs = ticketSettings.stats.averageResponseTime;

          if (averageMs < 1000) {
            formattedTime = `${Math.round(averageMs)} milliseconds`;
          } else if (averageMs < 60000) {
            formattedTime = `${Math.round(averageMs / 1000)} seconds`;
          } else {
            const minutes = Math.floor(averageMs / 60000);
            const seconds = Math.round((averageMs % 60000) / 1000);

            if (seconds === 0) {
              formattedTime = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
            } else {
              formattedTime = `${minutes} minute${
                minutes !== 1 ? "s" : ""
              } ${seconds} second${seconds !== 1 ? "s" : ""}`;
            }
          }
        }

        await ticketChannel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                [
                  `### 🎫 Support Ticket #${ticketSettings.totalTickets}`,
                  ``,
                  `Welcome ${interaction.user}!`,
                  ``,
                  `Our support team will be with you shortly. In the meantime, please:`,
                  `- Describe your issue in detail`,
                  `- Share any relevant screenshots`,
                  `- Provide error logs if applicable`,
                  `- Include steps to reproduce the issue`,
                  `### 📝 Ticket Details (For Staff)`,
                ].join("\n")
              )
              .addFields(
                {
                  name: "Email",
                  value: `${apiResponse.user?.email ?? "Not Provided"}`,
                  inline: true,
                },
                {
                  name: "Department",
                  value: `${
                    newTicket.department.charAt(0).toUpperCase() +
                    newTicket.department.slice(1)
                  }`,
                  inline: true,
                },
                // {
                //   name: "Ticket ID",
                //   value: `\`${newTicket.ticketId}\``,
                //   inline: true,
                // },
                {
                  name: "Average Response",
                  value: `${formattedTime}`,
                  inline: true,
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

  public async reopen({
    interaction,
    client,
  }: OpenTicketProps): Promise<unknown> {
    try {
      const channel = interaction.channel as TextChannel | NewsChannel;
      const userData = await User.findOne({ userId: interaction.user.id });

      if (!userData)
        return interaction.reply({
          content: `404 Not Found: \`UserDocument for ${interaction.user.id} not found in remote database.\``,
          flags: [MessageFlags.Ephemeral],
        });

      const ticketData = await Tickets.findOne({
        ticketId: channel.id,
      });

      if (!ticketData)
        return interaction.reply({
          content: `404 Not Found: \`TicketsDocument not found in remote database.\``,
          flags: [MessageFlags.Ephemeral],
        });

      if (ticketData.status !== "closed") {
        return interaction.reply({
          content: `409 Conflict: \`This ticket is not closed. Current status: ${ticketData.status}\`.`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      const isStaff = config.staff.staffRoleIds.some((roleId) =>
        (interaction.member as GuildMember)?.roles.cache.has(roleId)
      );

      if (ticketData.userId !== interaction.user.id && !isStaff) {
        return interaction.reply({
          content: `403 Forbidden: \`Only the ticket creator or staff members can reopen this ticket.\``,
          flags: [MessageFlags.Ephemeral],
        });
      }

      await channel.permissionOverwrites.edit(ticketData.userId, {
        SendMessages: true,
        AddReactions: true,
      });

      ticketData.status = "open";
      ticketData.timestamps.reopenedAt = Date.now();
      await ticketData.save();

      await channel.edit({
        parent: config.tickets.parentCategoryId,
      });

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("Ticket Reopened")
            .setDescription(
              `This ticket has been reopened by ${interaction.user}`
            )
            .setColor("Red"),
        ],
        components: [],
      });
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);

      return interaction.reply({
        content: `500 Internal Server Error: \`An error occurred while reopening the ticket.\``,
        flags: [MessageFlags.Ephemeral],
      });
    }
  }
}

export default OpenTicket;
