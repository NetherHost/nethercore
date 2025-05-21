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
import Tickets from "../../models/Tickets";
import TicketSettings from "../../models/TicketSettings";
import User from "../../models/User";
import {
  type Ticket as TicketProps,
  type User as UserProps,
} from "../../../types/global";
import config from "../../config";

interface TicketStaffProps {
  interaction: ButtonInteraction;
  client: Client;
}

class TicketStaff {
  constructor() {}

  public async openStaffPanel({ interaction }: TicketStaffProps) {
    try {
      const member = interaction.member as GuildMember;
      const hasStaffRole = config.staff.staffRoleIds.some((roleId) =>
        member.roles.cache.has(roleId)
      );

      if (!hasStaffRole)
        return interaction.reply({
          content:
            "403 Forbidden: `You do not have permission to perform this action.`",
          flags: [MessageFlags.Ephemeral],
        });

      const buttons = [
        {
          label: "Claim",
          customId: "ticket-staff-claim-button",
        },
        {
          label: "Lock",
          customId: "ticket-staff-lock-button",
        },
        {
          label: "Transcript",
          customId: "ticket-staff-transcript-button",
        },
        {
          label: "Elevate",
          customId: "ticket-staff-elevate-button",
        },
      ];

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttons.map((button) =>
          new ButtonBuilder()
            .setLabel(button.label)
            .setCustomId(button.customId)
            .setStyle(ButtonStyle.Secondary)
        )
      );

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Manage Support Ticket")
            .setDescription("Manage the current support ticket here.")
            .setColor("Red")
            .addFields(
              {
                name: `Claim`,
                value: `Indicate that you're managing this ticket. Press again to unclaim.`,
              },
              {
                name: `Lock`,
                value: `Temporarily locks this ticket. This is different from closing it.`,
              },
              {
                name: `Transcript`,
                value: `Force a transcipt to be generated, even if the user didn't request one.`,
              },
              {
                name: `Elevate`,
                value: `Send this ticket to higher/senior support. **For advanced issues**.`,
              }
            ),
        ],
        flags: [MessageFlags.Ephemeral],
        components: [row],
      });
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
    }
  }

  public async claimTicket({ interaction, client }: TicketStaffProps) {
    try {
      const ticketSettings = await TicketSettings.findOne();
      const ticket = await Tickets.findOne({
        ticketId: interaction.channel?.id,
      });
      const channel = interaction.channel as TextChannel;

      if (!ticketSettings)
        return interaction.reply({
          content: `500 Internal Server Error: \`A new TicketSetttings document was created. Please press the button again.\``,
          flags: [MessageFlags.Ephemeral],
        });

      if (!ticket)
        return interaction.reply({
          content: `404 Not Found: \`TicketsDocument not found in remote database.\``,
          flags: [MessageFlags.Ephemeral],
        });

      if (ticketSettings.claims.onlyOneClaimer) {
        if (ticket?.claim.status) {
          return interaction.reply({
            content: `409 Conflict: \`This ticket is already claimed by \`<@${ticket.claim.claimedBy}>`,
            flags: [MessageFlags.Ephemeral],
          });
        }

        ticket.claim = {
          status: true,
          claimedBy: interaction.user.id,
          claimedAt: Date.now(),
        };
      } else {
        ticket.claim = {
          status: true,
          claimedBy: interaction.user.id,
          claimedAt: Date.now(),
        };

        if (ticket.claim.status)
          console.log(
            `Overwriting previous claimer for ticket ${ticket.ticketId}`
          );
      }
      let authorUsername = "unknown";
      if (ticket.userId) {
        try {
          const authorUser = await client.users.fetch(ticket.userId);
          authorUsername = authorUser.username;
        } catch {}
      }

      const newChannelName =
        `ticket-${interaction.user.username}-${authorUsername}`
          .toLowerCase()
          .replace(/[^a-z0-9\-]/g, "");
      await channel.setName(newChannelName);

      await ticket.save();

      await channel.send({
        content: `This ticket has been claimed by <@${interaction.user.id}>.`,
      });

      return await interaction.reply({
        content: `You have successfully claimed this ticket.`,
        flags: [MessageFlags.Ephemeral],
      });
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
    }
  }
}

export default TicketStaff;
