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
  NewsChannel,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from "discord.js";
import Tickets from "../../models/Tickets";
import TicketSettings from "../../models/TicketSettings";
import User from "../../models/User";
import {
  type Ticket as TicketProps,
  type User as UserProps,
} from "../../../types/global";
import config from "../../config";

interface CloseTicketProps {
  interaction: ButtonInteraction;
  client: Client;
}

class CloseTicket {
  constructor() {}

  public async close({
    interaction,
    client,
  }: CloseTicketProps): Promise<unknown> {
    try {
      const channel = interaction.channel as TextChannel | NewsChannel;
      const userData = await User.findOne({ userId: interaction.user.id });

      if (!userData)
        return interaction.reply({
          content: `404 Not Found: \`UserDocument for ${interaction.user.id} not found in remote database.\``,
          flags: [MessageFlags.Ephemeral],
        });

      const ticketData = await Tickets.findOne({
        userId: interaction.user.id,
        status: "open",
      });

      if (!ticketData)
        return interaction.reply({
          content: `404 Not Found: \`TicketsDocument not found in remote database.\``,
        });

      if (["closed", "deleted"].includes(ticketData.status)) {
        return interaction.reply({
          content: `409 Conflict: This ticket is already ${ticketData.status}.`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      if (channel) {
        await channel.permissionOverwrites.edit(ticketData.userId, {
          SendMessages: false,
          AddReactions: false,
        });
      } else {
        return interaction.reply({
          content:
            "500 Internal Server Error: `Channel not found or not a guild text-based channel.`",
          flags: [MessageFlags.Ephemeral],
        });
      }

      ticketData.status = "closed";
      ticketData.timestamps.closedAt = Date.now();
      await ticketData.save();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Delete")
          .setCustomId("ticket-delete-button")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setLabel("Transcript")
          .setCustomId("ticket-transcript-button")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setLabel("Re-open")
          .setCustomId("reopen-ticket-button")
          .setStyle(ButtonStyle.Secondary)
      );

      await channel.edit({
        parent: config?.tickets?.closedCategoryId,
      });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Ticket Closed`)
            .setDescription(
              "This ticket has been closed. Below, there are some actions that the creator or a staff member can perform."
            )
            .setColor("Red")
            .setFields(
              {
                name: "Delete",
                value: `A staff member can delete if it is no longer being used. This will delete the channel and all of its messages.`,
                inline: true,
              },
              {
                name: "Transcript",
                value: `A file containing all messages in this ticket. Transcripts are not saved by Nether Host.`,
                inline: true,
              },
              {
                name: "Re-Open",
                value: `You or a staff member can re-open this ticket if you weren't finished using it.`,
                inline: true,
              }
            ),
        ],
        components: [row.toJSON()],
      });
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
    }
  }
}

export default CloseTicket;
