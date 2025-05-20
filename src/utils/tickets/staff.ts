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

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Claim")
          .setCustomId("ticket-staff-claim-button")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setLabel("Lock")
          .setCustomId("ticket-staff-lock-button")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setLabel("Transcript")
          .setCustomId("ticket-staff-transcript-button")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setLabel("Elevate")
          .setCustomId("ticket-staff-elevate-button")
          .setStyle(ButtonStyle.Secondary)
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
        components: [row],
      });
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
    }
  }
}
