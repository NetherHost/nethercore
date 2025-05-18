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

      ticketData.status = "deleted";
      ticketData.timestamps.deletedAt = Date.now();
      await ticketData.save();

      await channel.delete();
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
    }
  }
}

export default DeleteTicket;
