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

interface DeleteTicketProps {
  interaction: ButtonInteraction;
  client: Client;
}

class DeleteTicket {
  constructor() {}

  public async delete({
    interaction,
    client,
  }: DeleteTicketProps): Promise<unknown> {
    try {
      const member = interaction.member as GuildMember;
      const channel = interaction.channel as TextChannel | NewsChannel;
      const userData = await User.findOne({ userId: interaction.user.id });

      if (!userData)
        return interaction.reply({
          content: `404 Not Found: \`UserDocument for ${interaction.user.id} not found in remote database.\``,
          flags: [MessageFlags.Ephemeral],
        });

      const ticketData = await Tickets.findOne({
        userId: interaction.user.id,
        ticketId: channel.id,
      });

      if (!ticketData)
        return interaction.reply({
          content: `404 Not Found: \`TicketsDocument not found in remote database.\``,
          flags: [MessageFlags.Ephemeral],
        });

      if (ticketData.status === "open" || ticketData.status === "deleted")
        return interaction.reply({
          content:
            "409 Conflict: `This ticket cannot be deleted right now.`\n\n" +
            "- If it's still **open**, it must be closed first.\n" +
            "- If it's already **deleted**, the channel may have failed to delete. Please contact a staff member.",
          flags: [MessageFlags.Ephemeral],
        });

      const hasStaffRole = config.staff.staffRoleIds.some((roleId) =>
        member.roles.cache.has(roleId)
      );

      if (!hasStaffRole)
        return interaction.reply({
          content:
            "403 Forbidden: `You do not have permission to perform this action.`",
          flags: [MessageFlags.Ephemeral],
        });

      if (!ticketData.timestamps.firstResponseAt) {
        ticketData.timestamps.firstResponseAt = Date.now();

        const createdAt = ticketData.timestamps.createdAt;
        const respondedAt = Date.now();
        const responseTime = respondedAt - createdAt;

        ticketData.responseTime = responseTime;

        let formattedTime = "";
        if (responseTime < 1000) {
          formattedTime = `${Math.round(responseTime)} milliseconds`;
        } else if (responseTime < 60000) {
          formattedTime = `${Math.round(responseTime / 1000)} seconds`;
        } else {
          const minutes = Math.floor(responseTime / 60000);
          const seconds = Math.round((responseTime % 60000) / 1000);

          if (seconds === 0) {
            formattedTime = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
          } else {
            formattedTime = `${minutes} minute${
              minutes !== 1 ? "s" : ""
            } ${seconds} second${seconds !== 1 ? "s" : ""}`;
          }
        }

        const ticketSettings =
          (await TicketSettings.findOne()) || new TicketSettings();

        const currentTotal =
          ticketSettings.stats.averageResponseTime *
          ticketSettings.stats.totalTicketsWithResponse;
        const newTotal = currentTotal + responseTime;
        const newCount = ticketSettings.stats.totalTicketsWithResponse + 1;
        const newAverage = newTotal / newCount;

        ticketSettings.stats.averageResponseTime = newAverage;
        ticketSettings.stats.totalTicketsWithResponse = newCount;
        ticketSettings.stats.responseTimeLastUpdated = new Date();

        await ticketSettings.save();

        let formattedAverage = "";
        if (newAverage < 1000) {
          formattedAverage = `${Math.round(newAverage)} milliseconds`;
        } else if (newAverage < 60000) {
          formattedAverage = `${Math.round(newAverage / 1000)} seconds`;
        } else {
          const minutes = Math.floor(newAverage / 60000);
          const seconds = Math.round((newAverage % 60000) / 1000);

          if (seconds === 0) {
            formattedAverage = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
          } else {
            formattedAverage = `${minutes} minute${
              minutes !== 1 ? "s" : ""
            } ${seconds} second${seconds !== 1 ? "s" : ""}`;
          }
        }
      }

      ticketData.status = "deleted";
      ticketData.timestamps.deletedAt = Date.now();
      await ticketData.save();

      const ticketSettings =
        (await TicketSettings.findOne()) || new TicketSettings();
      ticketSettings.stats.totalResolved += 1;
      await ticketSettings.save();

      await channel.delete();
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
    }
  }
}

export default DeleteTicket;
