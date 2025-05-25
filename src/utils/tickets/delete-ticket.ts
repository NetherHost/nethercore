import {
  ButtonInteraction,
  Client,
  GuildMember,
  MessageFlags,
  TextChannel,
  NewsChannel,
} from "discord.js";
import Tickets from "../../models/Tickets";
import TicketSettings from "../../models/TicketSettings";
import User from "../../models/User";
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
