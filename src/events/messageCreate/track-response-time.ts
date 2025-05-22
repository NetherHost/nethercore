import { Client, Message } from "discord.js";
import { CommandKit } from "commandkit";
import Tickets from "../../models/Tickets";
import TicketSettings from "../../models/TicketSettings";
import config from "../../config";

export default async function (
  message: Message,
  client: Client<true>,
  handler: CommandKit
) {
  if (message.author.bot || !message.guild || !message.channel) return;

  const ticket = await Tickets.findOne({ ticketId: message.channel.id });
  if (!ticket) return;

  const member = await message.guild.members
    .fetch(message.author.id)
    .catch(() => null);
  if (!member) return;

  const isStaffMessage = config.staff.staffRoleIds.some((roleId) =>
    member.roles.cache.has(roleId)
  );

  if (!isStaffMessage) return;

  if (!ticket.timestamps.firstResponseAt) {
    const createdAt = ticket.timestamps.createdAt;
    const respondedAt = message.createdTimestamp;
    const responseTime = respondedAt - createdAt;

    ticket.timestamps.firstResponseAt = respondedAt;
    ticket.responseTime = responseTime;

    await ticket.save();

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
}
