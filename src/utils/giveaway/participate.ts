import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonInteraction,
  GuildMember,
} from "discord.js";
import Giveaway from "../../models/Giveaway";

interface ParticipationResult {
  success: boolean;
  error?: string;
  action?: "added" | "removed";
}

class Participate {
  constructor() {}

  public async execute(
    giveawayId: number,
    userId: string,
    messageId: string,
    interaction: ButtonInteraction,
    durationTimestamp: string
  ): Promise<ParticipationResult> {
    try {
      const giveaway = await Giveaway.findOne({ id: giveawayId });
      const member = interaction.member as GuildMember;

      if (!giveaway) {
        console.error("Giveaway not found in the database.");
        return { success: false, error: "That giveaway does not exist." };
      }

      if (giveaway.ended) {
        console.log(`Giveaway ${giveawayId} already ended.`);
        return { success: false, error: "That giveaway has already ended." };
      }

      const userRoles = member.roles
        ? member.roles.cache.map((role) => role.id)
        : [];
      const giveawayRequiresRole = Boolean(giveaway.requiredRole);

      if (
        giveawayRequiresRole &&
        !userRoles.includes(giveaway.requiredRole as string)
      ) {
        console.log(
          `User ${userId} does not have the required role: ${giveaway.requiredRole}.`
        );

        return {
          success: false,
          error:
            "You do not have the required role to participate in this giveaway.",
        };
      }

      if (giveaway.participants.includes(userId)) {
        giveaway.participants = giveaway.participants.filter(
          (id) => id !== userId
        );
        console.log(`User ${userId} removed from participation.`);
      } else {
        giveaway.participants.push(userId);
        console.log(`User ${userId} added to participation.`);
      }

      await giveaway.save();

      let giveawayMessage;
      try {
        giveawayMessage = await interaction.channel?.messages.fetch(messageId);
        if (!giveawayMessage) {
          console.error("Unable to fetch giveaway message.");
          return { success: false, error: "Unable to fetch giveaway message." };
        }
      } catch (error) {
        console.error("Unable to fetch giveaway message.");
        return { success: false, error: "Unable to fetch giveaway message." };
      }

      const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Participate")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`participate-giveaway-${giveaway.id}`),
        new ButtonBuilder()
          .setLabel(`${giveaway.participants.length}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
          .setCustomId(`participants-button-${giveaway.id}`)
      );

      await giveawayMessage.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle("New Giveaway 🎉")
            .setDescription("A new giveaway has been started!")
            .setColor("Red")
            .addFields(
              { name: "Prize", value: `${giveaway.prize}`, inline: false },
              {
                name: "Duration",
                value: `The giveaway will end ${durationTimestamp}`,
                inline: false,
              },
              {
                name: "Entries",
                value: `${giveaway.participants.length}`,
                inline: false,
              },
              {
                name: "Required Role",
                value: `${
                  giveaway.requiredRole
                    ? `<@&${giveaway.requiredRole}>`
                    : "None"
                }`,
                inline: false,
              }
            ),
        ],
        components: [updatedRow],
      });

      return {
        success: true,
        action: giveaway.participants.includes(userId) ? "added" : "removed",
      };
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
      return {
        success: false,
        error: "An error occurred processing your request.",
      };
    }
  }
}

export default Participate;
